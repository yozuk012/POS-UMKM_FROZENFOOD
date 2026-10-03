// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xxaaivmiljfqhagqpbyh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/UMKM-POS/**',
      },
    ],
  },
};

export default nextConfig;