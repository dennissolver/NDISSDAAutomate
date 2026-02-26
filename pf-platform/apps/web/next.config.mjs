import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@pf/shared', '@pf/core', '@pf/api'],
};

export default nextConfig;
