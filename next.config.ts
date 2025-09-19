import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "pub-1d11d6a89cf341e7966602ec50afd166.r2.dev",
      // 他に許可したいドメインがあればここに追加
    ],
  },
  // フォント最適化の設定
  optimizeFonts: true,
  // Service Workerの適切な配信設定
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // フォントファイルのキャッシュ設定
      {
        source: '/next/static/media/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
