// app/page.tsx
import WebcamUploader from '@/components/WebcamUploader';
import { inter, notoJP } from './fonts';

export default function Page() {
  return (
    <div className={`${inter.className} ${notoJP.className}`} style={{ letterSpacing: 0.2 }}>
      {/* 背景レイヤー */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      {/* メインコンテンツ */}
      <div className="relative z-10 min-h-screen">
        {/* ヘッダー */}
        <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">REALction</h1>
                  <p className="text-sm text-gray-400">あなたの顔でリアクションを作成</p>
                </div>
              </div>
              
              {/* ステータスインジケーター */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-900 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">カメラ準備完了</span>
              </div>
            </div>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <WebcamUploader />
        </div>
      </div>
    </div>
  );
}