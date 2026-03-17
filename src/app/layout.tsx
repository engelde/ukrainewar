import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0F",
};

export const metadata: Metadata = {
  title: {
    default: "Russo-Ukrainian War Tracker — ukrainewar.app",
    template: "%s — Russo-Ukrainian War Tracker",
  },
  description:
    "Real-time interactive tracker of the Russo-Ukrainian war. Explore equipment losses, casualty data, territory control, bilateral aid, and humanitarian impact through an immersive map experience.",
  keywords: [
    "Ukraine",
    "war",
    "tracker",
    "Russia",
    "Russian losses",
    "equipment losses",
    "casualties",
    "territory control",
    "humanitarian",
    "bilateral aid",
    "map",
    "conflict data",
    "Russo-Ukrainian war",
    "Ukraine map",
    "military losses",
    "refugee data",
  ],
  metadataBase: new URL("https://ukrainewar.app"),
  applicationName: "Russo-Ukrainian War Tracker",
  authors: [{ name: "ukrainewar.app" }],
  creator: "ukrainewar.app",
  publisher: "ukrainewar.app",
  category: "news",
  classification: "Conflict Data Visualization",
  openGraph: {
    title: "Russo-Ukrainian War Tracker",
    description:
      "Real-time data visualization of the Russo-Ukrainian war — equipment losses, territory control, bilateral aid, humanitarian data, and an interactive timeline of events.",
    url: "https://ukrainewar.app",
    siteName: "Russo-Ukrainian War Tracker",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Russo-Ukrainian War Tracker — Interactive map and data visualization of the Russo-Ukrainian war",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Russo-Ukrainian War Tracker",
    description:
      "Real-time interactive visualization of the Russo-Ukrainian war — losses, territory, aid, and humanitarian data",
    images: ["/og-image.png"],
    creator: "@ukrainewar_app",
  },
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
  alternates: {
    canonical: "https://ukrainewar.app",
  },
  other: {
    "theme-color": "#0A0A0F",
    "color-scheme": "dark",
    "msapplication-TileColor": "#0A0A0F",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Russo-Ukrainian War Tracker",
    url: "https://ukrainewar.app",
    description:
      "Real-time interactive tracker of the Russo-Ukrainian war with equipment losses, territory control, bilateral aid, and humanitarian data.",
    applicationCategory: "NewsApplication",
    operatingSystem: "Any",
    inLanguage: "en",
    isAccessibleForFree: true,
    about: {
      "@type": "Event",
      name: "Russo-Ukrainian War",
      startDate: "2022-02-24",
      location: {
        "@type": "Place",
        name: "Ukraine",
      },
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${dmMono.variable} antialiased overflow-hidden`}
      >
        <NuqsAdapter><TooltipProvider>{children}</TooltipProvider></NuqsAdapter>
      </body>
    </html>
  );
}

