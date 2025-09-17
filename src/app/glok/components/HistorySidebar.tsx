'use client';

import { useMemo } from 'react';
import { Thread } from '../types';
import { Trash2 } from 'lucide-react';

interface HistorySidebarProps {
  threads: Thread[];
  currentId: string | null;
  onSelectThread: (id: string) => void;
  onDeleteThread: (id: string) => void; // 削除機能を追加
  onClose: () => void;
  historyQuery: string;
  setHistoryQuery: (q: string) => void;
}

export default function HistorySidebar({
  threads, currentId, onSelectThread, onDeleteThread, onClose, historyQuery, setHistoryQuery,
}: HistorySidebarProps) {
  const filteredThreads = useMemo(() => {
    if (!historyQuery.trim()) return threads;
    const q = historyQuery.toLowerCase();
    return threads.filter(t => t.title.toLowerCase().includes(q) || t.messages.some(m => m.text.toLowerCase().includes(q)));
  }, [threads, historyQuery]);

  const handleDeleteClick = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation(); // 親要素のクリックイベントを防止
    if (confirm('この会話を削除しますか？')) {
      onDeleteThread(threadId);
    }
  };

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
            <div
              key={t.id}
              style={{
                position: 'relative',
                background: currentId === t.id ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: currentId === t.id ? '1px solid rgba(102, 126, 234, 0.5)' : '1px solid #333',
                borderRadius: 12,
                transition: 'all 0.3s ease',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => { onSelectThread(t.id); onClose(); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '16px',
                  paddingRight: '50px', // 削除ボタンのスペースを確保
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentId !== t.id) {
                    e.currentTarget.parentElement!.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentId !== t.id) {
                    e.currentTarget.parentElement!.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.messages[0]?.text ?? ''}
                </div>
              </button>
              
              {/* 削除ボタン */}
              <button
                onClick={(e) => handleDeleteClick(e, t.id)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 12,
                  transform: 'translateY(-50%)',
                  width: 32,
                  height: 32,
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: 8,
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  opacity: 0.7,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.5)';
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)';
                  e.currentTarget.style.opacity = '0.7';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
                title="この会話を削除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}