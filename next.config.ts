import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
  },
  async redirects() {
    return [
      {
        source: '/pricing',
        destination: '/exams',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
