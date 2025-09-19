"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceSettings } from './useVoiceSettings';

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isStoppingRef = useRef(false);
  const { voiceSettings, getSelectedVoice } = useVoiceSettings();

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      setError('お使いのブラウザは音声合成をサポートしていません');
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported) return;

    try {
      // 既存の音声を停止
      window.speechSynthesis.cancel();
      isStoppingRef.current = false;
      setError(null);

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // 設定された音声とパラメータを使用
      const selectedVoice = getSelectedVoice();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.lang = 'ja-JP';
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;

      utterance.onstart = () => {
        if (!isStoppingRef.current) {
          setIsSpeaking(true);
          setError(null);
        }
      };

      utterance.onend = () => {
        if (!isStoppingRef.current) {
          setIsSpeaking(false);
        }
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        // 停止操作によるエラーは無視
        if (isStoppingRef.current) {
          setIsSpeaking(false);
          utteranceRef.current = null;
          return;
        }
        
        console.error('Speech synthesis error:', event);
        setError(`音声読み上げエラー: ${event.error}`);
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Failed to speak:', err);
      setError('音声読み上げに失敗しました');
      setIsSpeaking(false);
    }
  }, [isSupported, voiceSettings, getSelectedVoice]);

  const stopSpeaking = useCallback(() => {
    if (isSupported) {
      isStoppingRef.current = true;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setError(null);
      utteranceRef.current = null;
    }
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    error,
    speak,
    stopSpeaking,
  };
}
