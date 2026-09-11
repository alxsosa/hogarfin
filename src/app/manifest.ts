import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oikos — Finanzas del hogar",
    short_name: "Oikos",
    description:
      "Presupuesto, cuentas, deudas, metas y patrimonio para tu hogar.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FDFCF7",
    theme_color: "#1f3a32",
    icons: [
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
