'use client';

import { useEffect, useMemo, useState } from 'react';
import { Thread, LS_KEY } from './types';
import Starfield from './components/Starfield';
import Header from './components/Header';
import HistorySidebar from './components/HistorySidebar';
import StartView from './components/StartView';
import ChatView from './components/ChatView';

export default function GlokPage() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');

  const [threads, setThreads] = useState<Thread[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const currentThread = useMemo(() => {
    return threads.find(t => t.id === currentId) || null;
  }, [threads, currentId]);

  const onSend = async () => {
    if (!prompt.trim() || loading) return;
    const userMsg = prompt.trim();
    setPrompt('');
    setError(null);
    setLoading(true);

    try {
      let threadId = currentId;
      if (!threadId) {
        threadId = crypto.randomUUID();
        const newThread: Thread = {
          id: threadId,
          title: userMsg.slice(0, 30) + (userMsg.length > 30 ? '...' : ''),
          messages: [],
          createdAt: Date.now(),
        };
        setThreads(prev => [newThread, ...prev]);
        setCurrentId(threadId);
      }

      const updatedThreads = threads.map(t => 
        t.id === threadId 
          ? { ...t, messages: [...t.messages, { role: 'user' as const, text: userMsg }] }
          : t
      );
      setThreads(updatedThreads);

      const resp = await fetch('/api/gemini-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_post: userMsg }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'APIエラーが発生しました');
      }

      const data = await resp.json();
      const assistantMsg = data.response || '申し訳ありませんが、回答を生成できませんでした。';

      const finalThreads = updatedThreads.map(t => 
        t.id === threadId 
          ? { ...t, messages: [...t.messages, { role: 'assistant' as const, text: assistantMsg }] }
          : t
      );
      setThreads(finalThreads);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const onNewChat = () => {
    setCurrentId(null);
    setPrompt('');
    setError(null);
  };

  const onGoHome = () => {
    setCurrentId(null);
    setPrompt('');
    setError(null);
  };

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(threads));
  }, [threads]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Starfield active={!currentThread} />
      
      <Header
        currentId={currentId}
        onGoHome={onGoHome}
        onNewChat={onNewChat}
        onShowHistory={() => setShowHistory(true)}
        showHistory={showHistory}
      />

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: currentThread ? 'flex-start' : 'center',
        minHeight: '100vh',
        paddingTop: currentThread ? 80 : 0,
      }}>
        {currentThread ? (
          <ChatView
            thread={currentThread}
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            error={error}
            onSend={onSend}
            onKeyDown={onKeyDown}
          />
        ) : (
          <StartView
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            onSend={onSend}
          />
        )}
      </div>

      {showHistory && (
        <HistorySidebar
          threads={threads}
          currentId={currentId}
          onSelectThread={setCurrentId}
          onClose={() => setShowHistory(false)}
          historyQuery={historyQuery}
          setHistoryQuery={setHistoryQuery}
        />
      )}
    </div>
  );
}
