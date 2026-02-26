/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pf/shared', '@pf/core', '@pf/api', '@pf/db'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
