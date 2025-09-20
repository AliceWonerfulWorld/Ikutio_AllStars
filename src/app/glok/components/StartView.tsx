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

// 完全なスタイルシステム - すべてのスタイルをJSで管理
const designSystem = {
  // 色システム
  colors: {
    white: '#ffffff',
    gray: {
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    accent: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  
  // スペーシングシステム
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 60,
    '7xl': 80,
    '8xl': 100,
  },
  
  // タイポグラフィシステム
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
      '7xl': 72,
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    letterSpacing: {
      tight: -0.025,
      normal: 0,
      wide: 0.025,
      wider: 0.05,
      widest: 1,
    },
  },
  
  // レイアウトシステム
  layout: {
    borderRadius: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      '2xl': 18,
      '3xl': 20,
      round: 25,
      full: '50%',
    },
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.5)',
      xl: '0 6px 25px rgba(0, 0, 0, 0.7)',
      glow: '0 0 20px rgba(255, 255, 255, 0.2)',
      text: '0 0 30px rgba(255, 255, 255, 0.3)',
    },
    backdrop: {
      blur: 'blur(10px)',
    },
  },
  
  // アニメーションシステム
  animation: {
    transition: 'all 0.3s ease',
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s',
    },
  },
};

// スタイルファクトリー関数群
const createBaseStyle = (): CSSProperties => ({
  transition: designSystem.animation.transition,
  fontFamily: 'system-ui, -apple-system, sans-serif',
});

const createTextStyle = (
  size: keyof typeof designSystem.typography.fontSize, 
  weight: keyof typeof designSystem.typography.fontWeight = 'normal', 
  color: string = designSystem.colors.white
): CSSProperties => ({
  ...createBaseStyle(),
  fontSize: designSystem.typography.fontSize[size],
  fontWeight: designSystem.typography.fontWeight[weight],
  color,
  lineHeight: 1.5,
});

const createSpacingStyle = (padding?: string, margin?: string): CSSProperties => ({
  ...(padding && { padding }),
  ...(margin && { margin }),
});

const createLayoutStyle = (
  radius: keyof typeof designSystem.layout.borderRadius, 
  shadow?: keyof typeof designSystem.layout.shadow
): CSSProperties => ({
  borderRadius: typeof designSystem.layout.borderRadius[radius] === 'number' 
    ? designSystem.layout.borderRadius[radius] 
    : designSystem.layout.borderRadius[radius],
  ...(shadow && { boxShadow: designSystem.layout.shadow[shadow] }),
});

const createButtonStyle = (
  variant: 'primary' | 'secondary' | 'danger' | 'gray', 
  size: 'small' | 'medium' | 'large' = 'medium'
): CSSProperties => {
  const sizeConfig = {
    small: { 
      padding: `${designSystem.spacing.md}px ${designSystem.spacing.lg}px`, 
      fontSize: designSystem.typography.fontSize.sm,
      minWidth: 100,
    },
    medium: { 
      padding: `${designSystem.spacing.md}px ${designSystem.spacing.xl}px`, 
      fontSize: designSystem.typography.fontSize.sm,
      minWidth: 120,
    },
    large: { 
      padding: `${designSystem.spacing.lg}px ${designSystem.spacing['3xl']}px`, 
      fontSize: designSystem.typography.fontSize.base,
      minWidth: 140,
    },
  };
  
  const variantConfig = {
    primary: {
      background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)',
      color: designSystem.colors.white,
      border: 'none',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: designSystem.colors.white,
      border: `1px solid rgba(255, 255, 255, 0.2)`,
      backdropFilter: designSystem.layout.backdrop.blur,
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: designSystem.colors.white,
      border: 'none',
    },
    gray: {
      background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
      color: designSystem.colors.white,
      border: 'none',
    },
  };
  
  return {
    ...createBaseStyle(),
    ...sizeConfig[size],
    ...variantConfig[variant],
    ...createLayoutStyle('round'),
    cursor: 'pointer',
    fontWeight: designSystem.typography.fontWeight.bold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designSystem.spacing.sm,
    outline: 'none',
  };
};

const createInputStyle = (size: 'small' | 'medium' | 'large' = 'medium'): CSSProperties => {
  const sizeConfig = {
    small: { 
      padding: `${designSystem.spacing.md}px ${designSystem.spacing.xl}px`, 
      fontSize: designSystem.typography.fontSize.sm,
    },
    medium: { 
      padding: `${designSystem.spacing.md}px ${designSystem.spacing.xl}px`, 
      fontSize: designSystem.typography.fontSize.sm,
    },
    large: { 
      padding: `${designSystem.spacing['6xl']}px ${designSystem.spacing.xl}px`, 
      fontSize: designSystem.typography.fontSize.base,
    },
  };
  
  return {
    ...createBaseStyle(),
    ...sizeConfig[size],
    flex: 1,
    minWidth: 0,
    ...createLayoutStyle('3xl'),
    border: '2px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: designSystem.colors.white,
    outline: 'none',
    backdropFilter: designSystem.layout.backdrop.blur,
  };
};

const createNotificationStyle = (type: 'error' | 'success' | 'info' = 'info'): CSSProperties => {
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
    ...createBaseStyle(),
    ...typeConfig[type],
    ...createLayoutStyle('lg'),
    ...createSpacingStyle(`${designSystem.spacing.md}px ${designSystem.spacing.lg}px`, `0 auto ${designSystem.spacing.xl}px`),
    fontSize: designSystem.typography.fontSize.sm,
    backdropFilter: designSystem.layout.backdrop.blur,
    maxWidth: 500,
  };
};

// レスポンシブ対応のヘルパー関数
const getResponsiveInputStyle = (): CSSProperties => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  return createInputStyle(isMobile ? 'medium' : 'large');
};

const getResponsiveTitleStyle = (): CSSProperties => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  return {
    ...createTextStyle(isMobile ? '5xl' : '7xl', 'black'),
    letterSpacing: designSystem.typography.letterSpacing.widest,
    display: 'inline-flex',
    alignItems: 'center',
    gap: isMobile ? designSystem.spacing.md : designSystem.spacing.lg,
    textShadow: designSystem.layout.shadow.text,
    marginBottom: designSystem.spacing.xl,
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  };
};

const getResponsiveSubtitleStyle = (): CSSProperties => ({
  ...createTextStyle('lg', 'light', designSystem.colors.gray[300]),
  letterSpacing: designSystem.typography.letterSpacing.wide,
});

const getResponsiveHintStyle = (): CSSProperties => ({
  ...createTextStyle('xs', 'light', designSystem.colors.gray[500]),
  marginTop: designSystem.spacing.md,
  opacity: 0.7,
});

// ホバー効果のスタイル
const createHoverStyle = (baseStyle: CSSProperties): CSSProperties => ({
  ...baseStyle,
  transform: 'translateY(-2px)',
  boxShadow: designSystem.layout.shadow.xl,
});

// コンテナスタイル
const containerStyle: CSSProperties = {
  textAlign: 'center',
  width: '100%',
  position: 'relative',
  zIndex: 1,
  paddingTop: designSystem.spacing['8xl'],
  paddingLeft: designSystem.spacing.xl,
  paddingRight: designSystem.spacing.xl,
};

const headerContainerStyle: CSSProperties = {
  marginBottom: designSystem.spacing['6xl'],
};

const inputContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: designSystem.spacing.md,
  width: '100%',
  maxWidth: 600,
  margin: '0 auto',
};

const sectionContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: designSystem.spacing.lg,
  marginBottom: designSystem.spacing['4xl'],
  maxWidth: '100%',
  width: '100%',
};

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  gap: designSystem.spacing.lg,
  justifyContent: 'center',
  flexWrap: 'wrap',
  padding: `0 ${designSystem.spacing.xl}px`,
};

const centeredContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
};

const clockIconStyle: CSSProperties = {
  display: 'inline-block',
  width: designSystem.spacing['5xl'],
  height: designSystem.spacing['5xl'],
  ...createLayoutStyle('full'),
  border: `4px solid ${designSystem.colors.gray[600]}`,
  position: 'relative',
  background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
  boxShadow: designSystem.layout.shadow.glow,
};

const clockHandStyle: CSSProperties = {
  position: 'absolute',
  left: -designSystem.spacing.sm,
  top: '50%',
  width: designSystem.spacing['3xl'],
  height: 4,
  background: designSystem.colors.white,
  transform: 'translateY(-50%) rotate(-25deg)',
  borderRadius: 2,
};

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
  const getSendButtonStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      ...createButtonStyle('primary'),
      width: 56,
      height: 56,
      ...createLayoutStyle('2xl'),
      fontSize: designSystem.typography.fontSize.xl,
      flexShrink: 0,
    };
    
    return hoveredButton === 'send' ? createHoverStyle(baseStyle) : baseStyle;
  };

  const getVoiceButtonStyle = (): CSSProperties => {
    const baseStyle = createButtonStyle(isListening ? 'danger' : 'gray');
    return hoveredButton === 'voice' ? createHoverStyle(baseStyle) : baseStyle;
  };

  const getActionButtonStyle = (buttonId: string): CSSProperties => {
    const baseStyle = createButtonStyle('secondary');
    return hoveredButton === buttonId ? createHoverStyle(baseStyle) : baseStyle;
  };

  return (
    <div style={containerStyle}>
      {/* ヘッダーセクション */}
      <div style={headerContainerStyle}>
        <div style={getResponsiveTitleStyle()}>
          <span aria-hidden style={clockIconStyle}>
            <span style={clockHandStyle} />
          </span>
          Clock
        </div>
        <div style={getResponsiveSubtitleStyle()}>
          あなたのAIアシスタント
        </div>
        <div style={getResponsiveHintStyle()}>
          「S」キーで流れ星を呼び出せます
        </div>
      </div>

      {/* 入力セクション */}
      <div style={sectionContainerStyle}>
        {/* 入力フィールドとボタン */}
        <div style={inputContainerStyle}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="どんなことでもお尋ねください (Enterで送信)"
            style={getResponsiveInputStyle()}
          />
          
          <button 
            onClick={onSend} 
            disabled={loading} 
            style={{
              ...getSendButtonStyle(),
              ...(loading && { opacity: 0.5, cursor: 'not-allowed' }),
            }}
            onMouseEnter={() => setHoveredButton('send')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            {loading ? '...' : '↑'}
          </button>
        </div>
        
        {/* 音声入力ボタン */}
        {isSupported && (
          <div style={centeredContainerStyle}>
            <button
              onClick={handleVoiceToggle}
              disabled={loading}
              style={{
                ...getVoiceButtonStyle(),
                ...(loading && { opacity: 0.5, cursor: 'not-allowed' }),
              }}
              onMouseEnter={() => setHoveredButton('voice')}
              onMouseLeave={() => setHoveredButton(null)}
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
          gap: designSystem.spacing.sm,
        }}>
          <div style={{
            width: designSystem.spacing.md,
            height: designSystem.spacing.md,
            background: designSystem.colors.accent.success,
            ...createLayoutStyle('full'),
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
      <div style={buttonGroupStyle}>
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
