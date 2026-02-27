/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pf/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
