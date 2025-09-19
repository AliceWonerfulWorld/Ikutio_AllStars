'use client';

import { Thread } from '../types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

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
  const { isSupported: speechSupported, isSpeaking, speak, stopSpeaking } = useSpeechSynthesis();

  const handleSpeak = (text: string) => {
    if (speechSupported) {
      speak(text);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 900, padding: '100px 16px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 100 }}>
        {thread.messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' 
                ? 'rgba(50, 50, 50, 0.8)'
                : 'rgba(255, 255, 255, 0.08)',
              border: m.role === 'user' 
                ? '1px solid rgba(255, 255, 255, 0.2)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              padding: '16px 20px',
              maxWidth: '80%',
              color: '#fff',
              fontSize: 16,
              lineHeight: 1.5,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}
          >
            <div>{m.text}</div>
            
            {/* AI回答に音声読み上げボタンを追加 */}
            {m.role === 'assistant' && speechSupported && (
              <button
                onClick={() => handleSpeak(m.text)}
                disabled={isSpeaking}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  padding: '4px 8px',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                }}
              >
                {isSpeaking ? '⏹️' : '🔊'}
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.2)',
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

      {/* 音声読み上げ停止ボタン */}
      {isSpeaking && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          right: 20,
          background: 'rgba(220, 38, 38, 0.9)',
          border: '1px solid rgba(220, 38, 38, 1)',
          borderRadius: 12,
          padding: '12px 16px',
          color: '#fff',
          fontSize: 14,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
        onClick={stopSpeaking}
        >
          <div style={{
            width: 8,
            height: 8,
            background: '#fff',
            borderRadius: '50%',
            animation: 'pulse 1s infinite',
          }} />
          音声読み上げ中 - クリックで停止
        </div>
      )}

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.7)',
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
              background: 'rgba(255, 255, 255, 0.08)',
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
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(50, 50, 50, 0.8)',
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