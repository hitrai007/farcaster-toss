/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Added headers for Farcaster frame support
  async headers() {
    return [
      {
        source: '/api/flip',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/farcaster',
        destination: '/api/farcaster-manifest'
      }
    ]
  }
}

module.exports = nextConfig 