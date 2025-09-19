"use client";

import { useState, useEffect, useCallback } from 'react';
import { VoiceSettings, VoiceOption, VOICE_SETTINGS_KEY } from '../types';

const defaultVoiceSettings: VoiceSettings = {
  voice: '',
  rate: 0.9,
  pitch: 1.0,
  volume: 0.8,
};

export function useVoiceSettings() {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(defaultVoiceSettings);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 利用可能な音声を取得
  const loadVoices = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      setIsLoading(false);
      return;
    }

    const voices = speechSynthesis.getVoices();
    const japaneseVoices = voices
      .filter(voice => voice.lang.startsWith('ja'))
      .map(voice => ({
        name: voice.name,
        voice: voice,
        description: `${voice.name} (${voice.lang})`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setAvailableVoices(japaneseVoices);

    // デフォルト音声を設定（最初の日本語音声）
    if (japaneseVoices.length > 0 && !voiceSettings.voice) {
      const defaultVoice = japaneseVoices[0].voice?.name || '';
      setVoiceSettings(prev => ({ ...prev, voice: defaultVoice }));
    }

    setIsLoading(false);
  }, [voiceSettings.voice]);

  // 音声リストの読み込み
  useEffect(() => {
    loadVoices();

    // 音声リストが非同期で読み込まれる場合があるため
    const handleVoicesChanged = () => {
      loadVoices();
    };

    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [loadVoices]);

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VOICE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setVoiceSettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load voice settings:', error);
    }
  }, []);

  // 設定を保存
  const updateVoiceSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    const updated = { ...voiceSettings, ...newSettings };
    setVoiceSettings(updated);
    
    try {
      localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    }
  }, [voiceSettings]);

  // 選択された音声オブジェクトを取得
  const getSelectedVoice = useCallback(() => {
    return availableVoices.find(v => v.voice?.name === voiceSettings.voice)?.voice || null;
  }, [availableVoices, voiceSettings.voice]);

  return {
    voiceSettings,
    availableVoices,
    isLoading,
    updateVoiceSettings,
    getSelectedVoice,
  };
}