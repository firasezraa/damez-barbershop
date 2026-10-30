import path from "node:path";
import type { NextConfig } from "next";

const nextConfig = {
  // Batasi root Turbopack ke repo ini. Tanpa ini Next memindai /home/ubuntu
  // (ada package.json + node_modules lain di sana) dan build bisa menggantung.
  turbopack: { root: path.resolve(import.meta.dirname) },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
} satisfies NextConfig;

export default nextConfig;
