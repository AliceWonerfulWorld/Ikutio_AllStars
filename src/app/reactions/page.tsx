'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReactionsPage() {
  const router = useRouter();

  useEffect(() => {
    // canvas.htmlページにリダイレクト
    window.location.href = '/canvas.html';
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>リアクションページに移動中...</p>
      </div>
    </div>
  );
}
