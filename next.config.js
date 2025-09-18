/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "da1ba209d61b3c9fb6834468fb0bb4f4.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-1d11d6a89cf341e7966602ec50afd166.r2.dev",
        pathname: "/**",
      },
      // 必要に応じて他のホストも追加
    ],
  },
};

module.exports = nextConfig;
