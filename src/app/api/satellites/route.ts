import { NextResponse } from "next/server";

/**
 * Fetches TLE data from CelesTrak for various satellite groups.
 * Completely free, no auth required.
 */

const CELESTRAK = "https://celestrak.org/NORAD/elements/gp.php";

// Maps our group IDs to CelesTrak group names
const GROUPS: Record<string, string[]> = {
  stations: ["stations"],
  starlink: ["starlink"],
  oneweb: ["oneweb"],
  gps: ["gps-ops", "glo-ops", "galileo", "beidou", "sbas"],
  comms: [
    "geo", "intelsat", "ses", "eutelsat", "telesat",
    "iridium-NEXT", "orbcomm", "globalstar",
    "amateur", "x-comm", "other-comm", "satnogs",
  ],
  weather: ["weather", "noaa", "goes", "resource", "sarsat", "argos"],
  science: ["science", "geodetic", "engineering", "education"],
  military: ["military", "radar"],
  other: ["planet", "spire", "cubesat", "dmc", "tdrss", "other"],
};

async function fetchGroup(group: string): Promise<string> {
  try {
    const res = await fetch(
      `${CELESTRAK}?GROUP=${group}&FORMAT=tle`,
      {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(15000),
        headers: {
          "User-Agent": "SatTracker/1.0 (satellite-tracker; educational)",
          "Accept": "text/plain, */*",
        },
      }
    );
    if (!res.ok) return "";
    const text = await res.text();
    // CelesTrak returns HTML error pages sometimes
    if (text.startsWith("<!") || text.startsWith("<html")) return "";
    return text;
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group") || "stations";

  const celestrakGroups = GROUPS[group];
  if (!celestrakGroups) {
    return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  }

  try {
    // Fetch all sub-groups in parallel (batched to avoid overwhelming CelesTrak)
    const batchSize = 4;
    let allTle = "";

    for (let i = 0; i < celestrakGroups.length; i += batchSize) {
      const batch = celestrakGroups.slice(i, i + batchSize);
      const results = await Promise.allSettled(batch.map(fetchGroup));
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          allTle += (allTle ? "\n" : "") + r.value;
        }
      }
    }

    return NextResponse.json({ group, tle: allTle });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch TLE data", group, tle: "" },
      { status: 502 }
    );
  }
}
