'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Thread, LS_KEY } from './types';
import Starfield from './components/Starfield';
import Header from './components/Header';
import HistorySidebar from './components/HistorySidebar';
import StartView from './components/StartView';
import ChatView from './components/ChatView';

export default function GlokPage() {
  const { user, loading: authLoading } = useAuth();
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
    
    // 認証チェック（より厳密に）
    if (!user || authLoading) {
      setError('ログインが必要です。先にサインインしてください。');
      return;
    }

    const userMsg = prompt.trim();
    setPrompt('');
    setError(null);
    setLoading(true);

    try {
      let threadId = currentId;
      let updatedThreads = threads;

      // 新しいスレッドを作成する場合
      if (!threadId) {
        threadId = crypto.randomUUID();
        const newThread: Thread = {
          id: threadId,
          title: userMsg.slice(0, 30) + (userMsg.length > 30 ? '...' : ''),
          messages: [{ role: 'user' as const, text: userMsg }],
          createdAt: Date.now(),
        };
        updatedThreads = [newThread, ...threads];
        setThreads(updatedThreads);
        setCurrentId(threadId); // チャット画面に移動
      } else {
        // 既存のスレッドに追加
        updatedThreads = threads.map(t => 
          t.id === threadId 
            ? { ...t, messages: [...t.messages, { role: 'user' as const, text: userMsg }] }
            : t
        );
        setThreads(updatedThreads);
      }

      // API呼び出し（認証ヘッダーを追加）
      const resp = await fetch('/api/gemini-api', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // クッキーを含める
        body: JSON.stringify({ prompt_post: userMsg }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        if (resp.status === 401) {
          setError('認証が無効です。再度ログインしてください。');
          return;
        }
        throw new Error(errorData.error || `APIエラー (${resp.status})`);
      }

      const data = await resp.json();
      const assistantMsg = data.response || '申し訳ありませんが、回答を生成できませんでした。';

      // アシスタントの返答を追加
      const finalThreads = updatedThreads.map(t => 
        t.id === threadId 
          ? { ...t, messages: [...t.messages, { role: 'assistant' as const, text: assistantMsg }] }
          : t
      );
      setThreads(finalThreads);

    } catch (err) {
      console.error('Grok API Error:', err);
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

  // 認証ローディング中
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p>認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 未ログインの場合
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
      }}>
        <Starfield active={true} />
        
        <div style={{
          textAlign: 'center',
          zIndex: 1,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '40px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h1 style={{ fontSize: '2.5em', marginBottom: '20px' }}>
            ログインが必要です
          </h1>
          <p style={{ fontSize: '1.2em', marginBottom: '30px', color: '#aaa' }}>
            Grokを使用するには、先にサインインしてください
          </p>
          <a 
            href="/auth/login" 
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)',
              color: 'white',
              padding: '15px 30px',
              borderRadius: '25px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '1px solid #444',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ログインページへ
          </a>
        </div>
      </div>
    );
  }

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
            onKeyDown={onKeyDown}
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
