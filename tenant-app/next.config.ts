import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin.html?tenantId=c50b014c-376c-46ba-b811-0f3207365632',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/admin.html?tenantId=c50b014c-376c-46ba-b811-0f3207365632',
        permanent: false,
      }
    ];
  },
};

export default nextConfig;
