import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  images: {
    remotePatterns: [new URL("https://picsum.photos/**")],
  },
  experimental: {
    useOffline: true,
  },
};

export default nextConfig;
