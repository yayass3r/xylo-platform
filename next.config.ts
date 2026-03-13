import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // TypeScript configuration - FIXED: No longer ignoring build errors
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // React Strict Mode - FIXED: Enabled for better development experience
  reactStrictMode: true,
  
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  
  // Allow cross-origin requests in development
  allowedDevOrigins: [
    'preview-chat-f0ded8b3-2758-4392-8db2-758d580160a5.space.z.ai',
    '.space.z.ai',
  ],
  
  // Disable experimental features that might cause issues
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'زايلو',
  },
};

export default nextConfig;
