import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agroconet Entregas",
    short_name: "Agroconet",
    description: "Área móvel de operação para entregadores Agroconet.",
    start_url: "/entregador",
    scope: "/",
    display: "standalone",
    background_color: "#f8f7f2",
    theme_color: "#285b3f",
    lang: "pt-MZ",
  };
}
