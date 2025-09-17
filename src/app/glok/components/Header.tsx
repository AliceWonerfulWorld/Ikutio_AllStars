'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface HeaderProps {
  currentId: string | null;
  onGoHome: () => void;
  onNewChat: () => void;
  onShowHistory: () => void;
  showHistory: boolean;
  onClearAllHistory: () => void; // 追加
}

export default function Header({
  currentId, onGoHome, onNewChat, onShowHistory, showHistory, onClearAllHistory,
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
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      <button
        onClick={handleGoHome}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 12,
          color: '#fff',
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        ← ホーム
      </button>

      <div style={{ display: 'flex', gap: 12 }}>
        {/* 全履歴削除ボタン */}
        <button
          onClick={onClearAllHistory}
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: 12,
            color: '#ef4444',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.5)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          title="すべての履歴を削除"
        >
          <Trash2 size={14} />
          <span>全削除</span>
        </button>

        <button
          onClick={onNewChat}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            color: '#fff',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          新しいチャット
        </button>

        <button
          onClick={onShowHistory}
          style={{
            background: showHistory ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: showHistory ? '1px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            color: '#fff',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            if (!showHistory) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showHistory) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          履歴
        </button>
      </div>
    </div>
  );
}