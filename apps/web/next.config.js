/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: `${process.env.REALTIME_SERVICE_URL || 'http://localhost:3006'}/socket.io/:path*`,
      },
    ]
  },
};

export default nextConfig;