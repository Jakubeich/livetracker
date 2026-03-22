"use client";
import { useRef, useEffect, useCallback } from "react";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import { latLonToVec3, computeOrbit } from "@/lib/satellite";
import type { SatGroup, SatelliteRecord } from "@/types";

const GROUP_COLORS: Record<SatGroup, string> = {
  stations: theme.stations, starlink: theme.starlink, oneweb: theme.oneweb,
  gps: theme.gps, comms: theme.comms, weather: theme.weather,
  science: theme.science, military: theme.military, other: theme.other,
};

const EARTH_TEX = "/textures/earth-topo-8k.jpg";
const EARTH_BUMP = "/textures/earth-topo-8k.jpg";
const EARTH_SPEC = "https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png";
const CLOUDS_TEX = "/textures/earth-clouds-4k.jpg";
const NIGHT_TEX = "/textures/earth-night-5k.jpg";

function getSunInfo(timeOffset: number = 0): { direction: [number, number, number]; seasonFactor: number } {
  const now = new Date(Date.now() + timeOffset);
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const hourUTC = now.getUTCHours() + now.getUTCMinutes() / 60;
  const sunLon = -((hourUTC / 24) * 360 - 180);
  const declination = 23.44 * Math.sin(((dayOfYear - 81) / 365) * 2 * Math.PI);
  const phi = (90 - declination) * (Math.PI / 180);
  const theta = (sunLon + 180) * (Math.PI / 180);
  const r = 10;
  // seasonFactor: -1 = northern winter solstice, +1 = northern summer solstice, 0 = equinox
  const seasonFactor = declination / 23.44;
  return {
    direction: [
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    ],
    seasonFactor,
  };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

// All Three.js objects stored here to avoid re-importing
let THREE: any = null;

export function GlobeView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const globeRef = useRef<any>(null);
  const cloudsRef = useRef<any>(null);
  const sunLightRef = useRef<any>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({ down: false, x: 0, y: 0, rotX: 0.5, rotY: 0.3, moved: false });
  const zoomRef = useRef(3.5);
  const targetZoomRef = useRef(3.5);
  const flyToRef = useRef<any>(null);
  const initRef = useRef(false);
  const raycasterRef = useRef<any>(null);
  const mouseVecRef = useRef<any>(null);

  // Instanced rendering refs
  const instancedMeshesRef = useRef<Map<string, any>>(new Map());
  const satIdMapRef = useRef<Map<number, string>>(new Map()); // instanceId -> satId per group
  const globalSatIdMapRef = useRef<{ group: string; index: number }[]>([]);

  // Special meshes (selected, hovered, stations detail)
  const specialMeshesRef = useRef<any[]>([]);
  const orbitLinesRef = useRef<any[]>([]);
  const labelsRef = useRef<any[]>([]);

  // Data refs (avoid re-renders triggering heavy rebuilds)
  const satsRef = useRef<SatelliteRecord[]>([]);
  const activeGroupsRef = useRef<Set<SatGroup>>(new Set());
  const selectedIdRef = useRef<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const showOrbitsRef = useRef(true);
  const needsRebuildRef = useRef(true);
  const lastSatCountRef = useRef(0);

  const dims = useStore(s => s.dims);
  const satellites = useStore(s => s.satellites);
  const activeGroups = useStore(s => s.activeGroups);
  const selectedId = useStore(s => s.selectedId);
  const setSelectedId = useStore(s => s.setSelectedId);
  const setHoveredId = useStore(s => s.setHoveredId);
  const hoveredId = useStore(s => s.hoveredId);
  const showOrbits = useStore(s => s.showOrbits);

  // Sync store values to refs
  useEffect(() => { satsRef.current = satellites; }, [satellites]);
  useEffect(() => {
    activeGroupsRef.current = activeGroups;
    needsRebuildRef.current = true;
  }, [activeGroups]);
  useEffect(() => {
    const prev = selectedIdRef.current;
    selectedIdRef.current = selectedId;
    if (prev !== selectedId) needsRebuildRef.current = true;

    // Fly-to on select
    if (selectedId) {
      const sat = satsRef.current.find(s => s.id === selectedId);
      if (sat) {
        const [x, y, z] = latLonToVec3(sat.lat, sat.lon, 0);
        const targetRotX = Math.atan2(x, z);
        const targetRotY = Math.asin(Math.max(-0.99, Math.min(0.99, y)));
        flyToRef.current = {
          active: true, progress: 0,
          startRot: { x: mouseRef.current.rotX, y: mouseRef.current.rotY },
          endRot: { x: targetRotX, y: targetRotY },
          startZoom: zoomRef.current,
          endZoom: Math.min(zoomRef.current, 2.5),
        };
      }
    }
  }, [selectedId]);
  useEffect(() => {
    hoveredIdRef.current = hoveredId;
    needsRebuildRef.current = true;
  }, [hoveredId]);
  useEffect(() => {
    showOrbitsRef.current = showOrbits;
    needsRebuildRef.current = true;
  }, [showOrbits]);

  // ======= INIT =======
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    const init = async () => {
      THREE = await import("three");
      const { w, h } = useStore.getState().dims;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#000005");
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
      camera.position.set(0, 0, zoomRef.current);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      containerRef.current!.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      raycasterRef.current = new THREE.Raycaster();
      mouseVecRef.current = new THREE.Vector2();

      // --- Lights ---
      scene.add(new THREE.AmbientLight(0x334466, 0.6));
      const sunInfo = getSunInfo();
      const sunDir = sunInfo.direction;
      const sunLight = new THREE.DirectionalLight(0xfff8e7, 3.0);
      sunLight.position.set(...sunDir);
      scene.add(sunLight);
      sunLightRef.current = sunLight;
      const fill = new THREE.DirectionalLight(0x4466aa, 0.3);
      fill.position.set(-sunDir[0], -sunDir[1], -sunDir[2]);
      scene.add(fill);

      // --- Textures ---
      const loader = new THREE.TextureLoader();
      const maxAniso = renderer.capabilities.getMaxAnisotropy();

      const loadTex = (url: string, srgb = false) => {
        const tex = loader.load(url);
        tex.anisotropy = maxAniso;
        if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      };

      // --- Earth with day/night shader ---
      const earthGeo = new THREE.SphereGeometry(1, 200, 200);
      const earthMat = new THREE.ShaderMaterial({
        uniforms: {
          dayTexture: { value: loadTex(EARTH_TEX, true) },
          nightTexture: { value: loadTex(NIGHT_TEX, true) },
          sunDirection: { value: new THREE.Vector3(...sunDir).normalize() },
          seasonFactor: { value: sunInfo.seasonFactor },
        },
        vertexShader: `
          varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorldPos; varying vec3 vWorldNormal;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
            vWorldPos = (modelMatrix * vec4(position,1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }`,
        fragmentShader: `
          uniform sampler2D dayTexture, nightTexture;
          uniform vec3 sunDirection;
          uniform float seasonFactor; // -1 = N.winter, +1 = N.summer

          varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorldPos; varying vec3 vWorldNormal;

          void main() {
            float d = dot(normalize(vWorldNormal), sunDirection);
            float dayF = smoothstep(-0.15, 0.2, d);
            vec3 day = texture2D(dayTexture, vUv).rgb;
            vec3 night = texture2D(nightTexture, vUv).rgb * 1.5;

            // --- Seasonal effects ---
            // Latitude from UV: 0.0 at south pole, 1.0 at north pole → remap to -1..+1
            float lat = (vUv.y - 0.5) * 2.0; // -1 = south pole, +1 = north pole

            // Detect land vs ocean: land tends to have more green/varied color, ocean is blue-ish
            float luminance = dot(day, vec3(0.299, 0.587, 0.114));
            float greenness = day.g - max(day.r, day.b);
            float isVegetation = smoothstep(0.02, 0.12, greenness) * smoothstep(0.15, 0.35, luminance);
            // Ocean detection: blue dominant, low luminance variation
            float blueDominance = day.b - max(day.r, day.g);
            float isOcean = smoothstep(0.0, 0.06, blueDominance);

            // Winter factor per hemisphere:
            // For northern hemisphere (lat > 0): winter when seasonFactor < 0
            // For southern hemisphere (lat < 0): winter when seasonFactor > 0
            float winterN = max(0.0, -seasonFactor); // 0..1, how much winter in north
            float winterS = max(0.0, seasonFactor);  // 0..1, how much winter in south

            float localWinter = lat > 0.0 ? winterN : winterS;
            float absLat = abs(lat);

            // Snow/ice cover on land at high latitudes during winter
            // More snow at higher latitudes, extending further toward equator in deep winter
            float snowLatStart = mix(0.75, 0.45, localWinter); // snow starts at lower lat in winter
            float snowAmount = smoothstep(snowLatStart, snowLatStart + 0.2, absLat) * localWinter;
            // Don't snow on oceans (they freeze differently)
            snowAmount *= (1.0 - isOcean * 0.7);
            // Snow color: slightly blue-tinted white
            vec3 snowColor = vec3(0.92, 0.94, 0.98);
            day = mix(day, snowColor, snowAmount * 0.7);

            // Polar ice caps: expand in winter, shrink in summer
            float iceCapBase = 0.88; // base ice cap latitude
            float iceCapShift = localWinter * 0.1; // expand up to 0.1 in latitude
            float iceCap = smoothstep(iceCapBase - iceCapShift, iceCapBase - iceCapShift + 0.06, absLat);
            day = mix(day, vec3(0.95, 0.97, 1.0), iceCap * 0.8);

            // Vegetation seasonal shift (mid-latitudes only)
            float midLat = smoothstep(0.15, 0.35, absLat) * smoothstep(0.75, 0.55, absLat);
            // In winter: desaturate vegetation (brown/dormant)
            float vegWinter = midLat * localWinter * isVegetation;
            vec3 winterVeg = vec3(
              day.r + 0.04,           // slightly warmer
              day.g * 0.75 + 0.02,    // less green
              day.b * 0.85            // slightly less blue
            );
            day = mix(day, winterVeg, vegWinter * 0.6);

            // In summer: boost vegetation slightly
            float localSummer = lat > 0.0 ? max(0.0, seasonFactor) : max(0.0, -seasonFactor);
            float vegSummer = midLat * localSummer * isVegetation;
            vec3 summerVeg = vec3(
              day.r * 0.92,           // slightly cooler
              day.g * 1.1 + 0.02,     // more green
              day.b * 0.95
            );
            day = mix(day, summerVeg, vegSummer * 0.35);

            // --- End seasonal effects ---

            vec3 c = mix(night, day, dayF);
            c += vec3(pow(max(d,0.0),20.0)*0.15*dayF);
            float rim = 1.0-max(dot(normalize(vNormal),normalize(-vWorldPos)),0.0);
            c += vec3(0.2,0.4,0.8)*pow(rim,3.0)*0.3*dayF;
            gl_FragColor = vec4(c,1.0);
          }`,
      });
      const earth = new THREE.Mesh(earthGeo, earthMat);
      scene.add(earth);
      globeRef.current = earth;

      // Clouds
      const cloudsTex = loadTex(CLOUDS_TEX);
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(1.008, 96, 96),
        new THREE.MeshPhongMaterial({ map: cloudsTex, transparent: true, opacity: 0.22, depthWrite: false })
      );
      scene.add(clouds);
      cloudsRef.current = clouds;

      // Atmosphere
      scene.add(new THREE.Mesh(
        new THREE.SphereGeometry(1.03, 48, 48),
        new THREE.ShaderMaterial({
          vertexShader: `varying vec3 vN; void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
          fragmentShader: `varying vec3 vN; void main(){float i=pow(0.65-dot(vN,vec3(0,0,1)),4.0);gl_FragColor=vec4(0.3,0.6,1.0,1.0)*i*1.5;}`,
          side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
        })
      ));


      // --- Mouse ---
      const el = renderer.domElement;
      el.addEventListener("mousedown", (e: MouseEvent) => { mouseRef.current = { ...mouseRef.current, down: true, moved: false, x: e.clientX, y: e.clientY }; flyToRef.current = null; });
      el.addEventListener("mousemove", (e: MouseEvent) => {
        if (mouseRef.current.down) {
          const dx = e.clientX - mouseRef.current.x, dy = e.clientY - mouseRef.current.y;
          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            mouseRef.current.moved = true;
            if (useStore.getState().followMode) useStore.getState().setFollowMode(false);
          }
          mouseRef.current.rotX += dx * 0.005;
          mouseRef.current.rotY = Math.max(-1.4, Math.min(1.4, mouseRef.current.rotY + dy * 0.005));
          mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY;
        }
        const rect = el.getBoundingClientRect();
        mouseVecRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVecRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      });
      el.addEventListener("mouseup", () => { mouseRef.current.down = false; });
      el.addEventListener("mouseleave", () => { mouseRef.current.down = false; });
      el.addEventListener("wheel", (e: WheelEvent) => { e.preventDefault(); targetZoomRef.current = Math.max(1.3, Math.min(12, targetZoomRef.current + e.deltaY * 0.003)); flyToRef.current = null; }, { passive: false });
      el.addEventListener("click", (e: MouseEvent) => {
        if (mouseRef.current.moved) return;
        const rect = el.getBoundingClientRect();
        const mv = new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1, -((e.clientY-rect.top)/rect.height)*2+1);
        raycasterRef.current.setFromCamera(mv, camera);
        // Check special meshes first, then instanced
        const specIntersects = raycasterRef.current.intersectObjects(specialMeshesRef.current, true);
        if (specIntersects.length > 0) {
          const obj = specIntersects[0].object;
          const satId = obj.userData.satId || obj.parent?.userData?.satId;
          if (satId) { useStore.getState().setSelectedId(satId); return; }
        }
        // Check instanced meshes
        for (const [groupKey, im] of Array.from(instancedMeshesRef.current)) {
          const hits = raycasterRef.current.intersectObject(im);
          if (hits.length > 0) {
            const idx = hits[0].instanceId;
            if (idx !== undefined) {
              const mapKey = `${groupKey}_${idx}`;
              const satId = satIdMapRef.current.get(idx);
              // Find satId from global map
              for (const entry of globalSatIdMapRef.current) {
                if (entry.group === groupKey && entry.index === idx) {
                  const sats = satsRef.current.filter(s => s.group === groupKey && activeGroupsRef.current.has(s.group));
                  if (sats[idx]) { useStore.getState().setSelectedId(sats[idx].id); return; }
                }
              }
            }
          }
        }
        useStore.getState().setSelectedId(null);
      });

      // ======= ANIMATION LOOP =======
      let lastUpdateTime = 0;
      const dummy = new THREE.Object3D();

      const animate = (time: number) => {
        frameRef.current = requestAnimationFrame(animate);

        if (cloudsRef.current) cloudsRef.current.rotation.y += 0.00008;

        // Update sun — every frame when time is shifted, otherwise every 10s
        const currentOffset = useStore.getState().timeOffset;
        const sunInterval = (currentOffset !== 0 || useStore.getState().simSpeed > 1) ? 100 : 10000;
        if (time - lastUpdateTime > sunInterval) {
          lastUpdateTime = time;
          const si = getSunInfo(currentOffset);
          const sd = si.direction;
          if (sunLightRef.current) sunLightRef.current.position.set(...sd);
          if (globeRef.current?.material?.uniforms?.sunDirection) {
            globeRef.current.material.uniforms.sunDirection.value.set(...sd).normalize();
            globeRef.current.material.uniforms.seasonFactor.value = si.seasonFactor;
          }
        }

        // Smooth zoom
        zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.08;

        // Fly-to
        const fly = flyToRef.current;
        if (fly?.active) {
          fly.progress = Math.min(1, fly.progress + 0.015);
          const t = easeInOutCubic(fly.progress);
          mouseRef.current.rotX = lerp(fly.startRot.x, fly.endRot.x, t);
          mouseRef.current.rotY = lerp(fly.startRot.y, fly.endRot.y, t);
          targetZoomRef.current = lerp(fly.startZoom, fly.endZoom, t);
          zoomRef.current = targetZoomRef.current;
          if (fly.progress >= 1) fly.active = false;
        }

        // Follow mode — smoothly track selected satellite
        if (useStore.getState().followMode && selectedIdRef.current && !fly?.active) {
          const sat = satsRef.current.find(s => s.id === selectedIdRef.current);
          if (sat) {
            const [x, y, z] = latLonToVec3(sat.lat, sat.lon, 0);
            const targetRotX = Math.atan2(x, z);
            const targetRotY = Math.asin(Math.max(-0.99, Math.min(0.99, y)));
            mouseRef.current.rotX = lerp(mouseRef.current.rotX, targetRotX, 0.05);
            mouseRef.current.rotY = lerp(mouseRef.current.rotY, targetRotY, 0.05);
          }
        }

        // Camera
        const r = zoomRef.current;
        camera.position.x = r * Math.sin(mouseRef.current.rotX) * Math.cos(mouseRef.current.rotY);
        camera.position.y = r * Math.sin(mouseRef.current.rotY);
        camera.position.z = r * Math.cos(mouseRef.current.rotX) * Math.cos(mouseRef.current.rotY);
        camera.lookAt(0, 0, 0);

        // Update instanced mesh positions (cheap — just matrix updates)
        const sats = satsRef.current;
        const groups = activeGroupsRef.current;
        const selId = selectedIdRef.current;
        const hovId = hoveredIdRef.current;

        // Check if we need full rebuild
        if (needsRebuildRef.current || sats.length !== lastSatCountRef.current) {
          needsRebuildRef.current = false;
          lastSatCountRef.current = sats.length;
          rebuildScene(scene, sats, groups, selId, hovId, showOrbitsRef.current, camera);
        } else {
          // Just update positions of instanced meshes
          updateInstancePositions(sats, groups, selId, hovId, dummy);
        }

        // Billboard labels
        for (const lbl of labelsRef.current) {
          if (lbl) lbl.lookAt(camera.position);
        }

        // Hover (throttled — only every 3 frames)
        if (!mouseRef.current.down && (time | 0) % 3 === 0 && specialMeshesRef.current.length > 0) {
          raycasterRef.current.setFromCamera(mouseVecRef.current, camera);
          const hits = raycasterRef.current.intersectObjects(specialMeshesRef.current, true);
          if (hits.length > 0) {
            const obj = hits[0].object;
            const satId = obj.userData.satId || obj.parent?.userData?.satId;
            if (satId && satId !== hoveredIdRef.current) useStore.getState().setHoveredId(satId);
            el.style.cursor = "pointer";
          } else {
            if (hoveredIdRef.current) useStore.getState().setHoveredId(null);
            el.style.cursor = "grab";
          }
        }

        renderer.render(scene, camera);
      };

      // --- Rebuild function ---
      const rebuildScene = (
        scene: any, sats: SatelliteRecord[], groups: Set<SatGroup>,
        selId: string | null, hovId: string | null, orbits: boolean, camera: any
      ) => {
        // Clear special meshes
        for (const m of specialMeshesRef.current) { scene.remove(m); disposeMesh(m); }
        specialMeshesRef.current = [];
        for (const l of labelsRef.current) { scene.remove(l); disposeMesh(l); }
        labelsRef.current = [];
        for (const l of orbitLinesRef.current) { scene.remove(l); disposeMesh(l); }
        orbitLinesRef.current = [];

        // Clear old instanced meshes
        for (const [, im] of Array.from(instancedMeshesRef.current)) { scene.remove(im); disposeMesh(im); }
        instancedMeshesRef.current.clear();
        globalSatIdMapRef.current = [];

        const filtered = sats.filter(s => groups.has(s.group));
        const allGroupKeys = Array.from(new Set(filtered.map(s => s.group)));

        // For each group, create an InstancedMesh
        for (const gk of allGroupKeys) {
          const groupSats = filtered.filter(s => s.group === gk && s.id !== selId && s.id !== hovId);
          if (groupSats.length === 0) continue;

          const color = new THREE.Color(GROUP_COLORS[gk] || "#888");
          const geo = createGroupGeometry(gk);
          const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
          const im = new THREE.InstancedMesh(geo, mat, groupSats.length);
          im.frustumCulled = false;

          for (let i = 0; i < groupSats.length; i++) {
            const sat = groupSats[i];
            const [x, y, z] = latLonToVec3(sat.lat, sat.lon, sat.alt);
            dummy.position.set(x, y, z);
            dummy.lookAt(0, 0, 0);
            dummy.rotateX(Math.PI / 2);
            const sc = gk === "stations" ? 1.3 : 0.8;
            dummy.scale.setScalar(sc);
            dummy.updateMatrix();
            im.setMatrixAt(i, dummy.matrix);
            globalSatIdMapRef.current.push({ group: gk, index: i });
          }
          im.instanceMatrix.needsUpdate = true;
          im.userData.groupKey = gk;
          im.userData.sats = groupSats;
          scene.add(im);
          instancedMeshesRef.current.set(gk, im);
        }

        // --- Special: selected & hovered & stations get detailed models ---
        const specialIds = new Set<string>();
        if (selId) specialIds.add(selId);
        if (hovId) specialIds.add(hovId);
        // Add all station satellites as special
        filtered.filter(s => s.group === "stations").forEach(s => specialIds.add(s.id));

        for (const id of Array.from(specialIds)) {
          const sat = sats.find(s => s.id === id);
          if (!sat || !groups.has(sat.group)) continue;

          const [x, y, z] = latLonToVec3(sat.lat, sat.lon, sat.alt);
          const color = new THREE.Color(GROUP_COLORS[sat.group] || "#888");
          const isSel = id === selId;
          const isHov = id === hovId;

          const model = buildSatModel(sat, color, isSel, isHov);
          model.position.set(x, y, z);
          model.lookAt(0, 0, 0);
          model.rotateX(Math.PI / 2);
          model.userData.satId = id;
          scene.add(model);
          specialMeshesRef.current.push(model);

          // Glow
          const glowSize = isSel ? 0.05 : isHov ? 0.04 : 0.03;
          const glow = new THREE.Mesh(
            new THREE.SphereGeometry(glowSize, 10, 10),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: isSel ? 0.4 : 0.2 })
          );
          glow.position.set(x, y, z);
          glow.userData.satId = id;
          scene.add(glow);
          specialMeshesRef.current.push(glow);

          // Label
          const label = createTextSprite(sat.name, GROUP_COLORS[sat.group], isSel ? 1 : 0.7);
          const up = new THREE.Vector3(x, y, z).normalize();
          label.position.set(x, y, z).add(up.multiplyScalar(0.05));
          scene.add(label);
          labelsRef.current.push(label);

          // Selected extras
          if (isSel) {
            const surfPt = latLonToVec3(sat.lat, sat.lon, 0);
            // Dashed link
            const pts = [];
            for (let i = 0; i <= 15; i++) {
              const t = i / 15;
              pts.push(new THREE.Vector3(
                surfPt[0]+(x-surfPt[0])*t, surfPt[1]+(y-surfPt[1])*t, surfPt[2]+(z-surfPt[2])*t
              ));
            }
            const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({
              color, transparent: true, opacity: 0.6, dashSize: 0.01, gapSize: 0.005,
            }));
            line.computeLineDistances();
            scene.add(line);
            orbitLinesRef.current.push(line);

            // Ground ring
            const ring = new THREE.Mesh(
              new THREE.RingGeometry(0.008, 0.016, 24),
              new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
            );
            ring.position.set(...surfPt);
            ring.lookAt(0, 0, 0);
            scene.add(ring);
            orbitLinesRef.current.push(ring);

            // Footprint
            const footAngle = Math.acos(6371 / (6371 + sat.alt));
            const fpPts: any[] = [];
            for (let i = 0; i <= 48; i++) {
              const a = (i / 48) * Math.PI * 2;
              const fLat = sat.lat + (footAngle * 180 / Math.PI) * Math.cos(a);
              const fLon = sat.lon + (footAngle * 180 / Math.PI) * Math.sin(a) / Math.cos(sat.lat * Math.PI / 180);
              const [fx, fy, fz] = latLonToVec3(fLat, fLon, 2);
              fpPts.push(new THREE.Vector3(fx, fy, fz));
            }
            const fp = new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(fpPts),
              new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 })
            );
            scene.add(fp);
            orbitLinesRef.current.push(fp);

            // Orbit
            const orbit = computeOrbit(sat, 150);
            if (orbit.length > 1) {
              const oPts = orbit.map(p => new THREE.Vector3(p.x, p.y, p.z));
              const oGeo = new THREE.BufferGeometry().setFromPoints(oPts);
              const cols = new Float32Array(orbit.length * 3);
              for (let i = 0; i < orbit.length; i++) {
                const f = 1 - (i / orbit.length) * 0.7;
                cols[i*3]=color.r*f; cols[i*3+1]=color.g*f; cols[i*3+2]=color.b*f;
              }
              oGeo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
              const oLine = new THREE.Line(oGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7 }));
              scene.add(oLine);
              orbitLinesRef.current.push(oLine);
            }
          }
        }

        // Station orbits (always)
        if (orbits) {
          const stations = filtered.filter(s => s.group === "stations" && s.id !== selId);
          for (const sat of stations) {
            const orbit = computeOrbit(sat, 80);
            if (orbit.length > 1) {
              const pts = orbit.map(p => new THREE.Vector3(p.x, p.y, p.z));
              const oLine = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({ color: new THREE.Color(GROUP_COLORS[sat.group]), transparent: true, opacity: 0.25 })
              );
              scene.add(oLine);
              orbitLinesRef.current.push(oLine);
            }
          }
        }
      };

      // --- Update instanced positions only (fast) ---
      const updateInstancePositions = (
        sats: SatelliteRecord[], groups: Set<SatGroup>,
        selId: string | null, hovId: string | null, dummy: any
      ) => {
        for (const [gk, im] of Array.from(instancedMeshesRef.current)) {
          const groupSats: SatelliteRecord[] = im.userData.sats;
          if (!groupSats) continue;

          let changed = false;
          for (let i = 0; i < groupSats.length; i++) {
            // Find updated position
            const updated = sats.find(s => s.id === groupSats[i].id);
            if (!updated) continue;
            if (updated.lat !== groupSats[i].lat || updated.lon !== groupSats[i].lon) {
              changed = true;
              groupSats[i] = updated;
              const [x, y, z] = latLonToVec3(updated.lat, updated.lon, updated.alt);
              dummy.position.set(x, y, z);
              dummy.lookAt(0, 0, 0);
              dummy.rotateX(Math.PI / 2);
              const sc = gk === "stations" ? 1.3 : 0.8;
              dummy.scale.setScalar(sc);
              dummy.updateMatrix();
              im.setMatrixAt(i, dummy.matrix);
            }
          }
          if (changed) im.instanceMatrix.needsUpdate = true;
        }

        // Update special meshes positions
        for (const m of specialMeshesRef.current) {
          const satId = m.userData.satId;
          if (!satId) continue;
          const sat = sats.find(s => s.id === satId);
          if (!sat) continue;
          const [x, y, z] = latLonToVec3(sat.lat, sat.lon, sat.alt);
          m.position.set(x, y, z);
          if (m.lookAt && m.type !== "Sprite" && m.children?.length > 0) {
            m.lookAt(0, 0, 0);
            m.rotation.x += Math.PI / 2;
          }
        }
      };

      requestAnimationFrame(animate);
    };

    init();

    const container = containerRef.current;
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return;
    rendererRef.current.setSize(dims.w, dims.h);
    cameraRef.current.aspect = dims.w / dims.h;
    cameraRef.current.updateProjectionMatrix();
  }, [dims]);

  return (
    <div ref={containerRef} style={{ position: "absolute", left: 0, top: 0, width: dims.w, height: dims.h, cursor: "grab" }} />
  );
}

// ======= GEOMETRY PER GROUP (shared, not per satellite) =======
function createGroupGeometry(group: string): any {
  switch (group) {
    case "stations": {
      // Cross shape (body + panels)
      const geo = new THREE.BoxGeometry(0.04, 0.002, 0.01);
      const geo2 = new THREE.BoxGeometry(0.01, 0.002, 0.025);
      const merged = mergeSimple(geo, geo2);
      return merged || geo;
    }
    case "starlink": {
      // Flat rectangle
      return new THREE.BoxGeometry(0.015, 0.001, 0.008);
    }
    case "oneweb": {
      return new THREE.BoxGeometry(0.012, 0.001, 0.01);
    }
    case "gps": {
      // Wider with panels
      return new THREE.BoxGeometry(0.02, 0.001, 0.006);
    }
    case "comms": {
      return new THREE.BoxGeometry(0.01, 0.008, 0.006);
    }
    case "military": {
      return new THREE.OctahedronGeometry(0.006);
    }
    case "weather": {
      return new THREE.BoxGeometry(0.008, 0.01, 0.008);
    }
    case "science": {
      return new THREE.CylinderGeometry(0.003, 0.005, 0.012, 6);
    }
    default:
      return new THREE.BoxGeometry(0.006, 0.006, 0.006);
  }
}

// Simple merge: just returns first geometry (true merge needs BufferGeometryUtils)
function mergeSimple(g1: any, _g2: any): any {
  return g1; // InstancedMesh can only use one geometry — keep it simple
}

// ======= DETAILED MODEL (only for selected/hovered/stations) =======
function buildSatModel(sat: SatelliteRecord, color: any, selected: boolean, hovered: boolean): any {
  const group = new THREE.Group();
  const ei = selected ? 0.8 : hovered ? 0.5 : 0.3;
  const sc = selected ? 1.4 : hovered ? 1.2 : 1.0;

  const bm = () => new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: ei, shininess: 80 });
  const pm = () => new THREE.MeshPhongMaterial({ color: new THREE.Color(0x1a3a6a), emissive: color, emissiveIntensity: ei * 0.3, shininess: 120 });

  switch (sat.group) {
    case "stations": {
      group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.02, 8), bm()));
      const pg = new THREE.BoxGeometry(0.025, 0.001, 0.008);
      for (const [ox, oz] of [[-0.02, 0], [0.02, 0], [-0.02, 0.012], [0.02, 0.012]] as [number,number][]) {
        const p = new THREE.Mesh(pg, pm()); p.position.set(ox, 0, oz); group.add(p);
      }
      group.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.002, 0.002), bm()));
      group.scale.setScalar(sc * 1.5);
      break;
    }
    case "starlink": {
      group.add(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.001, 0.012), bm()));
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0005, 0.008), pm());
      p.position.set(0.015, 0, 0); group.add(p);
      group.scale.setScalar(sc); break;
    }
    case "gps": {
      group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.01, 8), bm()));
      const pg = new THREE.BoxGeometry(0.024, 0.0005, 0.008);
      const l = new THREE.Mesh(pg, pm()); l.position.set(-0.016, 0, 0); group.add(l);
      const r = new THREE.Mesh(pg, pm()); r.position.set(0.016, 0, 0); group.add(r);
      const d = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.005, 8), bm());
      d.position.set(0, -0.008, 0); group.add(d);
      group.scale.setScalar(sc); break;
    }
    case "comms": {
      group.add(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.005), bm()));
      const pg = new THREE.BoxGeometry(0.018, 0.0005, 0.006);
      const l = new THREE.Mesh(pg, pm()); l.position.set(-0.014, 0, 0); group.add(l);
      const r = new THREE.Mesh(pg, pm()); r.position.set(0.014, 0, 0); group.add(r);
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8, 0, Math.PI*2, 0, Math.PI/2), bm());
      d.position.set(0, 0.006, 0); group.add(d);
      group.scale.setScalar(sc); break;
    }
    case "military": {
      group.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.006), bm()));
      const pg = new THREE.BoxGeometry(0.016, 0.0005, 0.005);
      const l = new THREE.Mesh(pg, pm()); l.position.set(-0.012, 0, 0); group.add(l);
      const r = new THREE.Mesh(pg, pm()); r.position.set(0.012, 0, 0); group.add(r);
      group.scale.setScalar(sc); break;
    }
    default: {
      group.add(new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.006), bm()));
      const pg = new THREE.BoxGeometry(0.016, 0.0005, 0.005);
      const l = new THREE.Mesh(pg, pm()); l.position.set(-0.012, 0, 0); group.add(l);
      const r = new THREE.Mesh(pg, pm()); r.position.set(0.012, 0, 0); group.add(r);
      group.scale.setScalar(sc); break;
    }
  }
  return group;
}

function createTextSprite(text: string, color: string, opacity: number): any {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = 512; canvas.height = 64;
  ctx.font = "bold 28px 'JetBrains Mono', monospace";
  const tw = ctx.measureText(text).width + 20;
  ctx.globalAlpha = opacity * 0.5;
  ctx.fillStyle = "#000000";
  ctx.beginPath(); ctx.roundRect((256 - tw / 2), 8, tw, 48, 8); ctx.fill();
  ctx.globalAlpha = opacity; ctx.fillStyle = color;
  ctx.fillText(text, 256 - ctx.measureText(text).width / 2, 40);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(0.12, 0.015, 1);
  return sprite;
}

function disposeMesh(obj: any) {
  if (!obj) return;
  obj.traverse?.((child: any) => {
    child.geometry?.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
      else { child.material.map?.dispose(); child.material.dispose(); }
    }
  });
  obj.geometry?.dispose();
  if (obj.material) {
    obj.material.map?.dispose();
    obj.material.dispose();
  }
}
