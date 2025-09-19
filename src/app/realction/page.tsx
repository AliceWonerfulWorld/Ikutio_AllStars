"use client";

import WebcamUploader from '@/components/WebcamUploader';
import { inter, notoJP } from './fonts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Home } from 'lucide-react';

export default function Page() {
  const { user } = useAuth();
  const router = useRouter();

  // 未ログインの場合の表示
  if (!user) {
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
        
        {/* ホームに戻るボタン */}
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          zIndex: 50,
        }}>
          <Link
            href="/"
            className="flex items-center space-x-2 bg-gray-800/90 hover:bg-gray-700/90 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-gray-600/50 shadow-lg cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <Home size={20} />
            <span className="font-semibold">ホームに戻る</span>
          </Link>
        </div>
        
        {/* メインコンテンツ */}
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            {/* アイコン */}
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full border border-green-500/30 backdrop-blur-sm">
                <Camera size={64} className="text-green-400" />
              </div>
            </div>
            
            {/* タイトル */}
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text text-transparent">
              会員限定制
            </h1>
            
            {/* 説明文 */}
            <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-600/30">
              <p className="text-gray-300 text-lg mb-4">
                REALctionは会員様限定の<br />
                特別なサービスです
              </p>
              <p className="text-gray-400 text-sm">
                ログインして、あなたの顔で<br />
                REALctionを作成しましょう
              </p>
            </div>
            
            {/* ボタン群 */}
            <div className="flex flex-row gap-4 justify-center">
              <Link 
                href="/auth/login"
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
              >
                <Camera size={20} />
                <span>ログインして利用開始</span>
              </Link>
              
              <Link 
                href="/auth/signup"
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span>新規会員登録</span>
              </Link>
            </div>
            
            {/* 追加情報 */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-xs">
                ※ 会員登録は無料です
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ログイン済みの場合の通常表示
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
                {/* 戻るボタン */}
                <Link
                  href="/"
                  className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-all duration-200 group"
                >
                  <svg 
                    className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 19l-7-7 7-7" 
                    />
                  </svg>
                </Link>
                
                {/* アイコンとタイトル */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
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