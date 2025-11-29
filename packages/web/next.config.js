/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sharelocal/shared'],
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Base path for sub-path deployment (e.g., /share-local/dev or /share-local/prd)
  // This will be set via NEXT_PUBLIC_BASE_PATH environment variable
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Asset prefix for static assets
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

module.exports = nextConfig;

