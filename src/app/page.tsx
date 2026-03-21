"use client";
import { useEffect } from "react";
import { useStore } from "@/stores/useStore";
import { useSatellites } from "@/hooks/useSatellites";
import { TopBar } from "@/components/layout/TopBar";
import { BottomBar, StatusBanner } from "@/components/layout/BottomBar";
import { GlobeView } from "@/components/globe/GlobeView";
import { LeftPanel } from "@/components/panels/LeftPanel";
import { DetailPanel } from "@/components/panels/DetailPanel";

export default function HomePage() {
  const setDims = useStore(s => s.setDims);

  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight - 56 });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [setDims]);

  const { refresh } = useSatellites();

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      userSelect: "none",
    }}>
      <TopBar onRefresh={refresh} />

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <GlobeView />
        <LeftPanel />
        <DetailPanel />
        <StatusBanner />
        <BottomBar />
      </div>
    </div>
  );
}
