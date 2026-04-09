import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      // Add any other domains you might need (e.g., Google or VK avatars)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
