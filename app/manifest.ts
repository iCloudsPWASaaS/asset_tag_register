import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AssetTag Register",
    short_name: "AssetTag",
    description:
      "Photograph, tag and document every asset across every site with QR labels and an exportable register.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#4f46e5",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
