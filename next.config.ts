import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wger.de",
      },
      {
        protocol: "https",
        hostname: "urkfnctewebefcnqyhyb.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/((?!api|_next|.*\\..*).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
