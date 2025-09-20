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

// 共通スタイルパターン - ベーススタイル
const baseStyles = {
  // 共通のトランジション
  transition: 'all 0.3s ease',
  
  // 共通のボーダーラディウス
  borderRadius: {
    small: 12,
    medium: 18,
    large: 20,
    round: 25,
    circle: '50%',
  },
  
  // 共通のボックスシャドウ
  boxShadow: {
    default: '0 4px 20px rgba(0, 0, 0, 0.5)',
    hover: '0 6px 25px rgba(0, 0, 0, 0.7)',
    glow: '0 0 20px rgba(255, 255, 255, 0.2)',
  },
  
  // 共通の背景グラデーション
  background: {
    primary: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)',
    secondary: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    gray: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
  },
  
  // 共通のボーダー
  border: {
    transparent: '2px solid rgba(255, 255, 255, 0.1)',
    white: '1px solid rgba(255, 255, 255, 0.2)',
    none: 'none',
  },
  
  // 共通のカラー
  color: {
    white: '#fff',
    gray: {
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
    },
  },
};

// スタイルファクトリー関数
const createButtonStyle = (variant: 'primary' | 'secondary' | 'danger' | 'gray', size: 'small' | 'medium' | 'large' = 'medium') => {
  const sizeConfig = {
    small: { padding: '8px 16px', fontSize: 12 },
    medium: { padding: '12px 24px', fontSize: 14 },
    large: { padding: '16px 32px', fontSize: 16 },
  };
  
  const variantConfig = {
    primary: {
      background: baseStyles.background.primary,
      color: baseStyles.color.white,
      border: baseStyles.border.none,
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: baseStyles.color.white,
      border: baseStyles.border.white,
    },
    danger: {
      background: baseStyles.background.danger,
      color: baseStyles.color.white,
      border: baseStyles.border.none,
    },
    gray: {
      background: baseStyles.background.gray,
      color: baseStyles.color.white,
      border: baseStyles.border.none,
    },
  };
  
  return {
    ...sizeConfig[size],
    ...variantConfig[variant],
    borderRadius: baseStyles.borderRadius.round,
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: baseStyles.boxShadow.default,
    transition: baseStyles.transition,
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: size === 'large' ? 140 : 120,
  };
};

const createInputStyle = (variant: 'default' | 'large' = 'default') => {
  const sizeConfig = {
    default: { padding: '14px 20px', fontSize: 14 },
    large: { padding: '18px 24px', fontSize: 16 },
  };
  
  return {
    ...sizeConfig[variant],
    flex: 1,
    minWidth: 0,
    borderRadius: baseStyles.borderRadius.large,
    border: baseStyles.border.transparent,
    background: 'rgba(255, 255, 255, 0.05)',
    color: baseStyles.color.white,
    outline: 'none',
    backdropFilter: 'blur(10px)',
    transition: baseStyles.transition,
  };
};

const createNotificationStyle = (type: 'error' | 'success' | 'info' = 'info') => {
  const typeConfig = {
    error: {
      background: 'rgba(220, 38, 38, 0.2)',
      border: '1px solid rgba(220, 38, 38, 0.4)',
      color: '#fca5a5',
    },
    success: {
      background: 'rgba(34, 197, 94, 0.2)',
      border: '1px solid rgba(34, 197, 94, 0.4)',
      color: '#86efac',
    },
    info: {
      background: 'rgba(59, 130, 246, 0.2)',
      border: '1px solid rgba(59, 130, 246, 0.4)',
      color: '#93c5fd',
    },
  };
  
  return {
    ...typeConfig[type],
    borderRadius: baseStyles.borderRadius.small,
    padding: '12px 16px',
    marginBottom: 20,
    fontSize: 14,
    backdropFilter: 'blur(10px)',
    maxWidth: 500,
    margin: '0 auto 20px',
  };
};

// レスポンシブ対応のヘルパー関数
const getResponsiveInputStyle = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  return createInputStyle(isMobile ? 'default' : 'large');
};

const getResponsiveTitleStyle = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  return {
    fontSize: isMobile ? 'clamp(36px, 6vw, 48px)' : 'clamp(48px, 8vw, 72px)',
    fontWeight: 900,
    letterSpacing: 2,
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: isMobile ? 12 : 16,
    color: baseStyles.color.white,
    textShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
  };
};

// ホバー効果のスタイル
const createHoverStyle = (baseStyle: any) => ({
  ...baseStyle,
  transform: 'translateY(-2px)',
  boxShadow: baseStyles.boxShadow.hover,
});

export default function StartView({
  prompt, setPrompt, loading, onSend, onKeyDown,
}: StartViewProps) {
  const { isListening, isSupported, error, startListening, stopListening, transcript, interimTranscript } = useSpeechRecognition();
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

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

  // 動的スタイル生成
  const getSendButtonStyle = () => {
    const baseStyle = {
      ...createButtonStyle('primary'),
      width: 56,
      height: 56,
      borderRadius: baseStyles.borderRadius.medium,
      fontSize: 20,
      flexShrink: 0,
    };
    
    return hoveredButton === 'send' ? createHoverStyle(baseStyle) : baseStyle;
  };

  const getVoiceButtonStyle = () => {
    const baseStyle = {
      ...createButtonStyle(isListening ? 'danger' : 'gray'),
    };
    
    return hoveredButton === 'voice' ? createHoverStyle(baseStyle) : baseStyle;
  };

  const getActionButtonStyle = (buttonId: string) => {
    const baseStyle = createButtonStyle('secondary');
    return hoveredButton === buttonId ? createHoverStyle(baseStyle) : baseStyle;
  };

  return (
    <div style={{
      textAlign: 'center',
      width: '100%',
      position: 'relative',
      zIndex: 1,
      paddingTop: 100,
      paddingLeft: 20,
      paddingRight: 20,
    }}>
      {/* ヘッダーセクション */}
      <div style={{ marginBottom: 60 }}>
        <div style={getResponsiveTitleStyle()}>
          <span aria-hidden style={{
            display: 'inline-block',
            width: 48,
            height: 48,
            borderRadius: baseStyles.borderRadius.circle,
            border: '4px solid #333',
            position: 'relative',
            background: baseStyles.background.secondary,
            boxShadow: baseStyles.boxShadow.glow,
          }}>
            <span style={{
              position: 'absolute',
              left: -8,
              top: '50%',
              width: 32,
              height: 4,
              background: baseStyles.color.white,
              transform: 'translateY(-50%) rotate(-25deg)',
              borderRadius: 2,
            }} />
          </span>
          Clock
        </div>
        <div className="text-lg text-gray-300 font-light tracking-wide">
          あなたのAIアシスタント
        </div>
        <div className="text-xs text-gray-500 font-light mt-2 opacity-70">
          💫 「S」キーで流れ星を呼び出せます
        </div>
      </div>

      {/* 入力セクション */}
      <div className="flex flex-col gap-4 mb-10 max-w-full w-full">
        {/* 入力フィールドとボタン */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 12,
          width: '100%',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="どんなことでもお尋ねください (Enterで送信)"
            style={getResponsiveInputStyle()}
            className="focus:border-white/30 focus:bg-white/10"
          />
          
          <button 
            onClick={onSend} 
            disabled={loading} 
            style={getSendButtonStyle()}
            onMouseEnter={() => setHoveredButton('send')}
            onMouseLeave={() => setHoveredButton(null)}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : '↑'}
          </button>
        </div>
        
        {/* 音声入力ボタン */}
        {isSupported && (
          <div className="flex justify-center w-full">
            <button
              onClick={handleVoiceToggle}
              disabled={loading}
              style={getVoiceButtonStyle()}
              onMouseEnter={() => setHoveredButton('voice')}
              onMouseLeave={() => setHoveredButton(null)}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isListening ? '⏹️ 停止' : '🎤 音声検索'}
            </button>
          </div>
        )}
      </div>

      {/* 通知セクション */}
      {error && (
        <div style={createNotificationStyle('error')}>
          {error}
        </div>
      )}

      {isListening && (
        <div style={{
          ...createNotificationStyle('success'),
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 12,
            height: 12,
            background: '#22c55e',
            borderRadius: baseStyles.borderRadius.circle,
            animation: 'pulse 1.5s infinite',
          }} />
          音声を認識中...
        </div>
      )}

      {interimTranscript && (
        <div style={{
          ...createNotificationStyle('info'),
          fontStyle: 'italic',
        }}>
          認識中: {interimTranscript}
        </div>
      )}

      {/* アクションボタンセクション */}
      <div className="flex gap-4 justify-center flex-wrap px-5">
        <button 
          onClick={() => setShowVoiceSettings(true)}
          style={getActionButtonStyle('voiceSettings')}
          onMouseEnter={() => setHoveredButton('voiceSettings')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          🎵 音声設定
        </button>
        
        <button 
          style={getActionButtonStyle('createImage')}
          onMouseEnter={() => setHoveredButton('createImage')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          🎨 画像を作成
        </button>
        
        <button 
          style={getActionButtonStyle('editImage')}
          onMouseEnter={() => setHoveredButton('editImage')}
          onMouseLeave={() => setHoveredButton(null)}
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
