import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#818cf8",
};

export const metadata: Metadata = {
  title: "SatTracker — Real-Time 3D Satellite Tracker",
  description:
    "Track thousands of real satellites orbiting Earth in real-time on an interactive 3D globe. View Starlink, ISS, GPS, military, weather satellites with orbital paths, pass predictions, and detailed TLE data. Powered by CelesTrak.",
  keywords: [
    "satellite tracker",
    "3D globe",
    "real-time satellites",
    "ISS tracker",
    "Starlink tracker",
    "GPS satellites",
    "orbital tracking",
    "TLE data",
    "CelesTrak",
    "space",
    "satellite visualization",
    "orbit prediction",
    "satellite pass prediction",
    "SGP4",
    "NORAD",
    "LEO satellites",
    "GEO satellites",
    "space station",
    "satellite map",
    "three.js globe",
  ],
  authors: [{ name: "SatTracker" }],
  creator: "SatTracker",
  publisher: "SatTracker",
  applicationName: "SatTracker",
  category: "Science & Education",

  // Open Graph
  openGraph: {
    type: "website",
    title: "SatTracker — Real-Time 3D Satellite Tracker",
    description:
      "Track thousands of real satellites orbiting Earth on an interactive 3D globe. Starlink, ISS, GPS, weather, military — all in real-time with orbital paths and pass predictions.",
    siteName: "SatTracker",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SatTracker — Real-Time 3D Satellite Tracker showing thousands of satellites orbiting Earth",
      },
    ],
  },

  // Twitter card
  twitter: {
    card: "summary_large_image",
    title: "SatTracker — Real-Time 3D Satellite Tracker",
    description:
      "Track thousands of real satellites orbiting Earth on an interactive 3D globe with orbital paths and pass predictions.",
    images: ["/og-image.png"],
  },

  // Favicons
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon.svg" },
    ],
  },

  // Manifest
  manifest: "/manifest.json",

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Other
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "SatTracker",
    "mobile-web-app-capable": "yes",
  },
};

// JSON-LD structured data for rich search results
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SatTracker",
  alternateName: "Real-Time 3D Satellite Tracker",
  description:
    "Track thousands of real satellites orbiting Earth in real-time on an interactive 3D globe with orbital paths, pass predictions, and detailed TLE data.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Real-time satellite tracking",
    "Interactive 3D globe",
    "Orbital path visualization",
    "Pass prediction over your location",
    "Time travel simulation",
    "4000+ satellites from CelesTrak",
    "Day/night cycle with city lights",
    "Seasonal Earth visualization",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
