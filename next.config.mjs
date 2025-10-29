/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['pg']
  },
  images: { unoptimized: true }
};

export default nextConfig;
