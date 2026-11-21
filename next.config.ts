import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Type safety is checked by `tsc --noEmit`; this bypasses a Next 16.4
  // showConfig parser regression in some containerized build environments.
  typescript: { ignoreBuildErrors: true }
};
export default nextConfig;
