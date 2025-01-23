import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
    ],
    domains: ['storage.googleapis.com'],
  },
  reactStrictMode: true,
};

export default nextConfig;
