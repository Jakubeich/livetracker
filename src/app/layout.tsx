import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SatTracker — Real-Time 3D Satellite Tracker",
  description: "Track real satellites orbiting Earth in real-time on an interactive 3D globe. Powered by CelesTrak TLE data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
