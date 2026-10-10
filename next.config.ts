import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  images: {
    remotePatterns: [
      new URL("https://picsum.photos/**"),
      new URL("https://thumb.wikimedia.org/**"),
      new URL("https://upload.wikimedia.org/**"),
    ],
  },
  experimental: {
    useOffline: true,
  },
};

export default nextConfig;
