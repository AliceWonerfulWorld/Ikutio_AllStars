export type Msg = { role: 'user' | 'assistant'; text: string };
export type Thread = { id: string; title: string; messages: Msg[]; createdAt: number };

export const LS_KEY = 'glok_history_v1';