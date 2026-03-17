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
  experimental: {
    optimizePackageImports: ["react-icons", "react-icons/tb", "react-icons/gi"],
  },
};

export default nextConfig;
