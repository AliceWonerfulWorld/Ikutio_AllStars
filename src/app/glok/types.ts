"use client";

export type Msg = { role: 'user' | 'assistant'; text: string };
export type Thread = { id: string; title: string; messages: Msg[]; createdAt: number };

// 音声機能の型定義
export type SpeechState = {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
};

// 音声設定の型定義
export interface VoiceSettings {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface VoiceOption {
  name: string;
  voice: SpeechSynthesisVoice | null;
  description: string;
}

export const LS_KEY = 'glok_history_v1';
export const VOICE_SETTINGS_KEY = 'glok_voice_settings_v1';