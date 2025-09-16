'use client';

import { useMemo } from 'react';
import { Thread } from '../types';

interface HistorySidebarProps {
  threads: Thread[];
  currentId: string | null;
  onSelectThread: (id: string) => void;
  onClose: () => void;
  historyQuery: string;
  setHistoryQuery: (q: string) => void;
}

export default function HistorySidebar({
  threads, currentId, onSelectThread, onClose, historyQuery, setHistoryQuery,
}: HistorySidebarProps) {
  const filteredThreads = useMemo(() => {
    if (!historyQuery.trim()) return threads;
    const q = historyQuery.toLowerCase();
    return threads.filter(t => t.title.toLowerCase().includes(q) || t.messages.some(m => m.text.toLowerCase().includes(q)));
  }, [threads, historyQuery]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
      />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 360,
          height: '100vh',
          background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
          borderLeft: '1px solid #333',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: 20, borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 600 }}>チャット履歴</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 20,
                padding: 4,
              }}
            >
              ×
            </button>
          </div>
          <input
            value={historyQuery}
            onChange={(e) => setHistoryQuery(e.target.value)}
            placeholder="Grokの履歴を検索"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #333',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              outline: 'none',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredThreads.length === 0 && (
            <div style={{ color: '#888', padding: '16px', textAlign: 'center' }}>履歴がありません</div>
          )}
          {filteredThreads.map((t) => (
            <button
              key={t.id}
              onClick={() => { onSelectThread(t.id); onClose(); }}
              style={{
                textAlign: 'left',
                padding: '16px',
                background: currentId === t.id ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: currentId === t.id ? '1px solid rgba(102, 126, 234, 0.5)' : '1px solid #333',
                borderRadius: 12,
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (currentId !== t.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentId !== t.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.messages[0]?.text ?? ''}
              </div>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}