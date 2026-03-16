import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ukraine War Tracker — uawar.app",
  description:
    "Real-time interactive tracker of the Russo-Ukrainian war. Explore equipment losses, casualty data, territory control, and humanitarian impact through an immersive map experience.",
  keywords: [
    "Ukraine",
    "war",
    "tracker",
    "Russia",
    "losses",
    "casualties",
    "map",
    "conflict",
    "data",
  ],
  openGraph: {
    title: "Ukraine War Tracker",
    description:
      "Real-time data visualization of the Russo-Ukrainian war",
    url: "https://uawar.app",
    siteName: "Ukraine War Tracker",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}

