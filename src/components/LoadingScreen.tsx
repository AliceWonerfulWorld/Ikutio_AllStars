"use client";

import { useState, useEffect } from "react";
import { CloudSun } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // プログレスバーのアニメーション
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15 + 5; // ランダムな進捗で自然な動き
      });
    }, 100);

    // 最小表示時間を確保（2秒）
    const minDisplayTimer = setTimeout(() => {
      if (progress >= 100) {
        handleComplete();
      }
    }, 2000);

    // 最大表示時間（4秒）
    const maxDisplayTimer = setTimeout(() => {
      handleComplete();
    }, 4000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(minDisplayTimer);
      clearTimeout(maxDisplayTimer);
    };
  }, []);

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 500); // フェードアウト後にコールバック実行
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20"></div>
      
      {/* 背景パターン */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%233B82F6%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* ロゴアニメーション */}
        <div className="relative mb-8">
          {/* 外側のグロー効果 */}
          <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>
          
          {/* メインアイコン */}
          <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
            <CloudSun size={48} className="text-white" />
          </div>
          
          {/* 回転するリング */}
          <div className="absolute inset-0 border-4 border-blue-400/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>

        {/* アプリ名 */}
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
          Tikuru24
        </h1>
        
        {/* サブタイトル */}
        <p className="text-gray-400 text-lg mb-8">
          瞬間で繋がるSNS
        </p>

        {/* プログレスバー */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>

        {/* ローディングテキスト */}
        <div className="mt-6 text-gray-500 text-sm">
          <div className="animate-pulse">
            {progress < 30 && "初期化中..."}
            {progress >= 30 && progress < 60 && "データ読み込み中..."}
            {progress >= 60 && progress < 90 && "設定を適用中..."}
            {progress >= 90 && "完了！"}
          </div>
        </div>

        {/* プログレスパーセンテージ */}
        <div className="mt-4 text-gray-400 text-xs">
          {Math.round(progress)}%
        </div>
      </div>

      {/* フェードアウト効果 */}
      <style jsx>{`
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        
        .fade-out {
          animation: fadeOut 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
