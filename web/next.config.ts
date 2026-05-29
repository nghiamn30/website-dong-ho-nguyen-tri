import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for minimal Docker images
  output: "standalone",
};

export default nextConfig;
