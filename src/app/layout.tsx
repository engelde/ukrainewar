import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    default: "Ukraine War Tracker — uawar.app",
    template: "%s — Ukraine War Tracker",
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
  metadataBase: new URL("https://uawar.app"),
  applicationName: "Ukraine War Tracker",
  authors: [{ name: "uawar.app" }],
  creator: "uawar.app",
  publisher: "uawar.app",
  category: "news",
  classification: "Conflict Data Visualization",
  openGraph: {
    title: "Ukraine War Tracker",
    description:
      "Real-time data visualization of the Russo-Ukrainian war — equipment losses, territory control, bilateral aid, humanitarian data, and an interactive timeline of events.",
    url: "https://uawar.app",
    siteName: "Ukraine War Tracker",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ukraine War Tracker — Interactive map and data visualization of the Russo-Ukrainian war",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ukraine War Tracker",
    description:
      "Real-time interactive visualization of the Russo-Ukrainian war — losses, territory, aid, and humanitarian data",
    images: ["/og-image.png"],
    creator: "@uawar_app",
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
    canonical: "https://uawar.app",
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
    name: "Ukraine War Tracker",
    url: "https://uawar.app",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}

