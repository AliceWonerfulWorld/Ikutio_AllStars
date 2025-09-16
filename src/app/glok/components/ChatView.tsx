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
    <div style={{ width: '100%', maxWidth: 900, padding: '100px 16px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 100 }}>
        {thread.messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' 
                ? 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)' // 黒ベースのグラデーション
                : 'rgba(255, 255, 255, 0.05)',
              border: m.role === 'user' 
                ? '1px solid #444' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              padding: '16px 20px',
              maxWidth: '80%',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              boxShadow: m.role === 'user' 
                ? '0 4px 20px rgba(0, 0, 0, 0.5)' // 黒いシャドウ
                : '0 2px 10px rgba(0, 0, 0, 0.2)',
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 20,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3))',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, width: 'min(900px, 92%)', margin: '0 auto' }}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="どんなことでもお尋ねください"
            style={{
              flex: 1,
              padding: '16px 20px',
              borderRadius: 20,
              border: '2px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              outline: 'none',
              fontSize: 16,
              backdropFilter: 'blur(10px)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          <button 
            onClick={onSend} 
            disabled={loading} 
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              border: 'none',
              background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)', // 黒ベースのグラデーション
              color: '#fff',
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)', // 黒いシャドウ
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? '...' : '↑'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          color: '#ff6b6b', 
          marginTop: 16, 
          padding: '12px 16px',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: 12,
          textAlign: 'center',
        }}>
          エラー: {error}
        </div>
      )}
    </div>
  );
}