import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Necesario para que los assets carguen bien en GitHub Pages
  // (el repo se sirve en /contrato-arrendamiento/)
  basePath: "/contrato-arrendamiento",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
