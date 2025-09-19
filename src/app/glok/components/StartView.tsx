'use client';

import React, { useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import VoiceSettings from './VoiceSettings';

interface StartViewProps {
  prompt: string;
  setPrompt: (v: string) => void;
  loading: boolean;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function StartView({
  prompt, setPrompt, loading, onSend, onKeyDown,
}: StartViewProps) {
  const { isListening, isSupported, error, startListening, stopListening, transcript, interimTranscript } = useSpeechRecognition();
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // 音声認識結果をプロンプトに設定
  React.useEffect(() => {
    if (transcript) {
      setPrompt(transcript);
    }
  }, [transcript, setPrompt]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      width: '100%', 
      position: 'relative', 
      zIndex: 1,
      paddingTop: 100,
    }}>
      <div style={{ marginBottom: 60 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            color: '#fff',
            textShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
            marginBottom: 20,
          }}
        >
          <span 
            aria-hidden 
            style={{ 
              display: 'inline-block', 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              border: '4px solid #333',
              position: 'relative',
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
            }}
          >
            <span style={{ 
              position: 'absolute', 
              left: -8, 
              top: '50%', 
              width: 32, 
              height: 4, 
              background: '#fff', 
              transform: 'translateY(-50%) rotate(-25deg)',
              borderRadius: 2,
            }} />
          </span>
          Clock
        </div>
        <div style={{
          fontSize: 18,
          color: '#aaa',
          fontWeight: 300,
          letterSpacing: 1,
        }}>
          あなたのAIアシスタント
        </div>
        <div style={{
          fontSize: 12,
          color: '#666',
          fontWeight: 300,
          marginTop: 10,
          opacity: 0.7,
        }}>
          💫 「S」キーで流れ星を呼び出せます
        </div>
      </div>

      <div style={{ display: 'inline-flex', gap: 12, marginBottom: 40 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="どんなことでもお尋ねください (Enterで送信)"
          style={{
            flex: 1,
            minWidth: 400,
            padding: '18px 24px',
            borderRadius: 20,
            border: '2px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            outline: 'none',
            fontSize: 16,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        />
        
        {/* 送信ボタン（左側に移動） */}
        <button 
          onClick={onSend} 
          disabled={loading} 
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            border: 'none',
            background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 20,
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
          }}
        >
          {loading ? '...' : '↑'}
        </button>
        
        {/* 音声入力ボタン（右側に移動） */}
        {isSupported && (
          <button
            onClick={handleVoiceToggle}
            disabled={loading}
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              border: 'none',
              background: isListening 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 20,
              fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
            }}
          >
            {isListening ? '⏹️' : '🎤'}
          </button>
        )}
      </div>

      {/* 音声認識エラー表示 */}
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
          maxWidth: 500,
          margin: '0 auto 20px',
        }}>
          {error}
        </div>
      )}

      {/* 音声認識状態表示 */}
      {isListening && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#86efac',
          fontSize: 14,
          backdropFilter: 'blur(10px)',
          maxWidth: 500,
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 12,
            height: 12,
            background: '#22c55e',
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite',
          }} />
          音声を認識中...
        </div>
      )}

      {/* 音声認識の暫定結果表示 */}
      {interimTranscript && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.2)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#93c5fd',
          fontSize: 14,
          backdropFilter: 'blur(10px)',
          maxWidth: 500,
          margin: '0 auto 20px',
          fontStyle: 'italic',
        }}>
          認識中: {interimTranscript}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button 
          onClick={() => setShowVoiceSettings(true)}
          style={{
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 25,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🎵 音声設定
        </button>
        <button style={{
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 25,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          🎨 画像を作成
        </button>
        <button style={{
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 25,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          ✏️ 画像を編集
        </button>
      </div>

      {/* 音声設定モーダル */}
      <VoiceSettings 
        isOpen={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
      />
    </div>
  );
}
