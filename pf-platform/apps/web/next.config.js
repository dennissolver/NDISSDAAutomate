/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pf/shared', '@pf/core', '@pf/api', '@pf/db'],
};

module.exports = nextConfig;
