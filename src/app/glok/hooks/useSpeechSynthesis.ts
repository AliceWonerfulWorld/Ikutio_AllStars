"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isStoppingRef = useRef(false);

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
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

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
  }, [isSupported]);

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
