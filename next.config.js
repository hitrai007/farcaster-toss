/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['farcaster-toss.vercel.app'],
  },
  async headers() {
    return [
      {
        source: '/.well-known/farcaster-manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/farcaster/:path*',
        destination: '/api/farcaster/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      encoding: require.resolve('encoding'),
    };
    return config;
  },
};

module.exports = nextConfig; 