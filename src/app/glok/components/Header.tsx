'use client';

import { useRouter } from 'next/navigation';

interface HeaderProps {
  currentId: string | null;
  onGoHome: () => void;
  onNewChat: () => void;
  onShowHistory: () => void;
  showHistory: boolean;
}

export default function Header({
  currentId, onGoHome, onNewChat, onShowHistory, showHistory,
}: HeaderProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      borderBottom: '1px solid #333',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    }}>
      <button
        onClick={handleGoHome}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 12,
          padding: '8px 16px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        ← ホーム
      </button>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onNewChat}
          style={{
            background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)', // 黒ベースのグラデーション
            border: '1px solid #444',
            borderRadius: 12,
            padding: '10px 20px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
          }}
        >
          新しいチャット
        </button>
        <button
          onClick={onShowHistory}
          style={{
            background: showHistory ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            padding: '10px 20px',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          履歴
        </button>
      </div>
    </div>
  );
}