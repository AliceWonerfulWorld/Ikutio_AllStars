"use client";

import React, { useState } from 'react';
import { useVoiceSettings } from '../hooks/useVoiceSettings';
import type { VoiceSettings } from '../types';
import { Volume2, Mic, Settings } from 'lucide-react';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceSettings({ isOpen, onClose }: VoiceSettingsProps) {
  const { voiceSettings, availableVoices, isLoading, updateVoiceSettings } = useVoiceSettings();
  const [previewText, setPreviewText] = useState('こんにちは、Clockです。音声設定のテストです。');

  const handlePreview = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(previewText);
      const selectedVoice = availableVoices.find(v => v.voice?.name === voiceSettings.voice)?.voice;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.lang = 'ja-JP';
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 32,
        maxWidth: 500,
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        backdropFilter: 'blur(20px)',
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#fff',
          }}>
            <Settings size={24} />
            <h2 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
            }}>
              音声設定
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaa',
              fontSize: 24,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>
            音声を読み込み中...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 音声選択 */}
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}>
                音声の種類
              </label>
              <select
                value={voiceSettings.voice}
                onChange={(e) => updateVoiceSettings({ voice: e.target.value })}
                style={{
                  width: '100%',
                  padding: 12,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {availableVoices.map((voice) => (
                  <option 
                    key={voice.name} 
                    value={voice.name}
                    style={{
                      backgroundColor: '#1a1a1a',
                      color: '#fff',
                    }}
                  >
                    {voice.description}
                  </option>
                ))}
              </select>
            </div>

            {/* 読み上げ速度 */}
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}>
                読み上げ速度: {voiceSettings.rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={voiceSettings.rate}
                onChange={(e) => updateVoiceSettings({ rate: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  height: 6,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* 音の高さ */}
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}>
                音の高さ: {voiceSettings.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceSettings.pitch}
                onChange={(e) => updateVoiceSettings({ pitch: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  height: 6,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* 音量 */}
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}>
                音量: {Math.round(voiceSettings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={voiceSettings.volume}
                onChange={(e) => updateVoiceSettings({ volume: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  height: 6,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* プレビュー */}
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}>
                プレビュー
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="プレビューテキストを入力"
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
                <button
                  onClick={handlePreview}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: 8,
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Volume2 size={16} />
                  再生
                </button>
              </div>
            </div>

            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              style={{
                padding: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              設定を保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
