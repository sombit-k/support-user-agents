/** @type {import('next').NextConfig} */
const nextConfig = {
  // Move external packages configuration to the correct location
  serverExternalPackages: ['@prisma/client']
};

export default nextConfig;
