import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ukr.warspotting.net",
      },
    ],
  },
};

export default nextConfig;
