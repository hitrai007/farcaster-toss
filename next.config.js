/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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