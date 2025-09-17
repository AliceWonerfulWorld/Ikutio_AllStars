'use client';

import { Thread } from '../types';

interface ChatViewProps {
  thread: Thread;
  prompt: string;
  setPrompt: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function ChatView({
  thread, prompt, setPrompt, loading, error, onSend, onKeyDown,
}: ChatViewProps) {
  return (
    <div style={{ width: '100%', maxWidth: 900, padding: '100px 16px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 100 }}>
        {thread.messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' 
                ? 'rgba(50, 50, 50, 0.8)' // より透明に調整
                : 'rgba(255, 255, 255, 0.08)', // 少し透明度を上げる
              border: m.role === 'user' 
                ? '1px solid rgba(255, 255, 255, 0.2)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              padding: '16px 20px',
              maxWidth: '80%',
              color: '#fff',
              fontSize: 16,
              lineHeight: 1.5,
              backdropFilter: 'blur(10px)', // ブラー効果を追加
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', // 影を追加
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.2)', // エラーも透明に
          border: '1px solid rgba(220, 38, 38, 0.4)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#fca5a5',
          fontSize: 14,
          backdropFilter: 'blur(10px)',
        }}>
          {error}
        </div>
      )}

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.7)', // 背景を透明に
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: 20,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 12 }}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="どんなことでもお尋ねください (Enterで送信)"
            style={{
              flex: 1,
              padding: '16px 20px',
              borderRadius: 25,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.08)', // より透明に
              color: '#fff',
              outline: 'none',
              fontSize: 16,
              backdropFilter: 'blur(10px)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
          />
          <button 
            onClick={onSend} 
            disabled={loading} 
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              border: '1px solid rgba(255, 255, 255, 0.2)', // 重複を解消：borderを1つに統一
              background: 'rgba(50, 50, 50, 0.8)', // より透明に
              color: '#fff',
              cursor: 'pointer',
              fontSize: 20,
              fontWeight: 'bold',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = 'rgba(70, 70, 70, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(50, 50, 50, 0.8)';
            }}
          >
            {loading ? '...' : '↑'}
          </button>
        </div>
      </div>
    </div>
  );
}