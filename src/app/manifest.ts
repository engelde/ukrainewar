import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Russo-Ukrainian War Tracker",
    short_name: "Ukraine War",
    description:
      "Real-time interactive tracker of the Russo-Ukrainian war with equipment losses, territory control, and humanitarian data.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0F",
    theme_color: "#0A0A0F",
    orientation: "any",
    categories: ["news", "education"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
