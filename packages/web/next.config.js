/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sharelocal/shared'],
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // KEIN basePath - NGINX entfernt Prefix mit rewrite
  // Next.js läuft auf Root-Level, NGINX fügt /share-local/dev Prefix hinzu
  basePath: '',
  assetPrefix: '',
};

module.exports = nextConfig;

