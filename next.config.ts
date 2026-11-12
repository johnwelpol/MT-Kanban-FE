import type { NextConfig } from "next";

const noReferrer = [{ key: "Referrer-Policy", value: "no-referrer" }];
// no-referrer makes browsers send `Origin: null` on form posts, which Next rejects for server actions.
const sameOriginReferrer = [{ key: "Referrer-Policy", value: "same-origin" }];

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      { source: "/auth/callback", headers: noReferrer },
      { source: "/invite/:token", headers: sameOriginReferrer },
      { source: "/reset-password", headers: sameOriginReferrer },
    ];
  },
};

export default nextConfig;
