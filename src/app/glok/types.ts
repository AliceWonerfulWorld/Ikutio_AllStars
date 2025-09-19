"use client";

export type Msg = { role: 'user' | 'assistant'; text: string };
export type Thread = { id: string; title: string; messages: Msg[]; createdAt: number };

// 音声機能の型定義
export type SpeechState = {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
};

export const LS_KEY = 'glok_history_v1';