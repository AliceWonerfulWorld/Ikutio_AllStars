'use client';

import React, { useState, CSSProperties } from 'react';
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

  // スタイル定義
  const containerStyle: CSSProperties = {
    textAlign: 'center',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '80px 20px 40px',
  };

  const titleContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '16px',
  };

  const logoStyle: CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
    boxShadow: '0 0 8px rgba(255, 255, 255, 0.1)',
  };

  const clockHandStyle: CSSProperties = {
    width: '4px',
    height: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '2px',
    position: 'absolute',
    transformOrigin: 'center center',
    transform: 'translate(-8px, -4px) rotate(250deg)',
    boxShadow: '0 0 4px rgba(255, 255, 255, 0.2)',
  };

  const titleStyle: CSSProperties = {
    fontSize: '72px',
    fontWeight: 900,
    color: '#ffffff',
    letterSpacing: '0.05em',
    textShadow: '0 0 40px rgba(255, 255, 255, 0.7)',
    fontFamily: '"Inter", "SF Pro Display", "Helvetica Neue", "Arial Black", sans-serif',
    fontStretch: 'ultra-condensed',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: '18px',
    fontWeight: 300,
    color: '#ffffff',
    marginBottom: '8px',
    opacity: 0.9,
  };

  const hintStyle: CSSProperties = {
    fontSize: '12px',
    fontWeight: 300,
    color: '#9ca3af',
    marginBottom: '40px',
    opacity: 0.7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  };

  const inputContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    maxWidth: '600px',
    margin: '0 auto 32px',
  };

  const inputStyle: CSSProperties = {
    flex: 1,
    padding: '12px 20px',
    fontSize: '16px',
    color: '#ffffff',
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    outline: 'none',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease',
  };

  const sendButtonStyle: CSSProperties = {
    width: '56px',
    height: '56px',
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
  };

  const actionButtonStyle: CSSProperties = {
    padding: '12px 24px',
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    minWidth: '140px',
  };

  const voiceButtonStyle: CSSProperties = {
    ...actionButtonStyle,
    minWidth: '160px',
  };

  const buttonGroupStyle: CSSProperties = {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '24px',
  };

  const notificationStyle: CSSProperties = {
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    margin: '0 auto 20px',
    maxWidth: '500px',
    backdropFilter: 'blur(10px)',
  };

  const errorStyle: CSSProperties = {
    ...notificationStyle,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    border: '1px solid rgba(220, 38, 38, 0.4)',
    color: '#fca5a5',
  };

  const successStyle: CSSProperties = {
    ...notificationStyle,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    border: '1px solid rgba(34, 197, 94, 0.4)',
    color: '#86efac',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const infoStyle: CSSProperties = {
    ...notificationStyle,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    color: '#93c5fd',
    fontStyle: 'italic',
  };

  return (
    <div style={containerStyle}>
      {/* タイトルとロゴ */}
      <div style={titleContainerStyle}>
        <div style={logoStyle}>
          <div style={clockHandStyle} />
        </div>
        <div style={titleStyle}>Clock</div>
      </div>
      
      {/* サブタイトル */}
      <div style={subtitleStyle}>あなたのAIアシスタント</div>
      
      {/* ヒント */}
      <div style={hintStyle}>
        「S」キーで流れ星を呼び出せます
        <span style={{ fontSize: '14px', color: '#fbbf24' }}>✨</span>
      </div>

      {/* 入力フィールド */}
      <div style={inputContainerStyle}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="どんなことでもお尋ねください (Enterで送信)"
          style={inputStyle}
        />
        
        <button 
          onClick={onSend} 
          disabled={loading} 
          style={{
            ...sendButtonStyle,
            ...(loading && { opacity: 0.5, cursor: 'not-allowed' }),
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = 'rgba(75, 85, 99, 0.8)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.8)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {loading ? '...' : '↑'}
        </button>
      </div>

      {/* 通知 */}
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {isListening && (
        <div style={successStyle}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#22c55e',
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite',
          }} />
          音声を認識中...
        </div>
      )}

      {interimTranscript && (
        <div style={infoStyle}>
          認識中: {interimTranscript}
        </div>
      )}

      {/* アクションボタン */}
      <div style={buttonGroupStyle}>
        {isSupported && (
          <button
            onClick={handleVoiceToggle}
            disabled={loading}
            style={{
              ...voiceButtonStyle,
              ...(loading && { opacity: 0.5, cursor: 'not-allowed' }),
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'rgba(75, 85, 99, 0.8)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.8)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isListening ? '⏹️ 停止' : '🎤 音声検索'}
          </button>
        )}
        
        <button 
          onClick={() => setShowVoiceSettings(true)}
          style={actionButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(75, 85, 99, 0.8)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.8)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🎵 音声設定
        </button>
        
        <button 
          style={actionButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(75, 85, 99, 0.8)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.8)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🎨 画像を作成
        </button>
        
        <button 
          style={actionButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(75, 85, 99, 0.8)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.8)';
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
