/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sharelocal/shared'],
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Konfiguration für Sub-Path Deployment (z.B. /share-local/dev)
  // Wird zur Build-Zeit über NEXT_PUBLIC_BASE_PATH gesetzt
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

module.exports = nextConfig;

