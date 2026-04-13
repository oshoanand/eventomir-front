import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
  // REMOVED: swcMinify: true (Causes fatal build errors in Next.js 15)
});

const nextConfig: NextConfig = {
  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  images: {
    remotePatterns: [
      // 1. Production MinIO Server (via Nginx SSL)
      {
        protocol: "https",
        hostname: "s3.eventomir.ru",
        port: "",
        pathname: "/**", // Allow all buckets and files
      },
      // 2. Localhost MinIO (for local development)
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      // 3. 127.0.0.1 MinIO (Alternative local development)
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/**",
      },
      // 4. Google Avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // 5. Yandex Avatars
      {
        protocol: "https",
        hostname: "avatars.yandex.net",
      },
    ],
  },
};

export default withPWA(nextConfig);
