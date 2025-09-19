'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Thread, LS_KEY } from './types';
import Starfield, { StarfieldRef } from './components/Starfield';
import Header from './components/Header';
import HistorySidebar from './components/HistorySidebar';
import StartView from './components/StartView';
import ChatView from './components/ChatView';
import DeleteAllConfirmModal from './components/DeleteAllConfirmModal';

export default function GlokPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const starfieldRef = useRef<StarfieldRef>(null);

  // ユーザー別の履歴キー
  const userHistoryKey = user ? `${LS_KEY}_${user.id}` : LS_KEY;

  const [threads, setThreads] = useState<Thread[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(userHistoryKey) || '[]');
    } catch {
      return [];
    }
  });

  const currentThread = useMemo(() => {
    return threads.find(t => t.id === currentId) || null;
  }, [threads, currentId]);

  // キーボードイベントの処理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Sキーまたはsキーが押された場合
      if (event.key.toLowerCase() === 's' || event.code === 'KeyS') {
        // 入力フィールドにフォーカスがある場合は無視
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        
        event.preventDefault();
        
        if (starfieldRef.current) {
          starfieldRef.current.triggerShootingStars();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const onSend = async () => {
    if (!prompt.trim() || loading) return;
    
    // 認証チェック
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

      console.log('Sending request to Gemini API...');
      console.log('User ID:', user.id);

      // API呼び出し（ユーザーIDをボディに含める）
      const resp = await fetch('/api/gemini-api', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt_post: userMsg,
          user_id: user.id // フロントエンドから送信
        }),
      });

      console.log('API Response status:', resp.status);

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        console.log('API Error data:', errorData);
        throw new Error(errorData.error || `APIエラー (${resp.status})`);
      }

      const data = await resp.json();
      console.log('API Response data:', data);
      
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

  // 履歴削除機能
  const onDeleteThread = (threadId: string) => {
    const updatedThreads = threads.filter(t => t.id !== threadId);
    setThreads(updatedThreads);
    
    // 削除されたスレッドが現在選択中の場合、選択を解除
    if (currentId === threadId) {
      setCurrentId(null);
      setPrompt('');
      setError(null);
    }
    
    console.log(`🗑️ スレッド "${threadId}" を削除しました`);
  };

  // 全履歴削除機能
  const onClearAllHistory = () => {
    setShowDeleteAllModal(true);
  };

  const handleConfirmDeleteAll = () => {
    setThreads([]);
    setCurrentId(null);
    setPrompt('');
    setError(null);
    setShowDeleteAllModal(false);
    console.log('🗑️ すべての履歴を削除しました');
  };

  const handleCancelDeleteAll = () => {
    setShowDeleteAllModal(false);
  };

  // ユーザー別の履歴を保存
  useEffect(() => {
    if (user) {
      localStorage.setItem(userHistoryKey, JSON.stringify(threads));
    }
  }, [threads, userHistoryKey, user]);

  // ユーザーが変わった時に履歴を読み込み直す
  useEffect(() => {
    if (user) {
      try {
        const userThreads = JSON.parse(localStorage.getItem(userHistoryKey) || '[]');
        setThreads(userThreads);
      } catch {
        setThreads([]);
      }
      // 現在のチャットをリセット
      setCurrentId(null);
      setPrompt('');
      setError(null);
    }
  }, [user?.id, userHistoryKey]);

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
        <Starfield ref={starfieldRef} active={true} />
        
        {/* ホームに戻るボタン */}
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          zIndex: 10,
        }}>
          <button
            onClick={() => router.push("/")}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
            }}
          >
            <Home size={20} />
            <span>ホームに戻る</span>
          </button>
        </div>
        
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
            Clockを使用するには、先にサインインしてください
          </p>
          
          {/* ボタン群 */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
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
            
            <a 
              href="/auth/signup" 
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #444 0%, #2a2a2a 100%)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '25px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                border: '1px solid #555',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              新規会員登録
            </a>
          </div>
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
      <Starfield ref={starfieldRef} active={true} />
      
      <Header
        currentId={currentId}
        onGoHome={onGoHome}
        onNewChat={onNewChat}
        onShowHistory={() => setShowHistory(true)}
        showHistory={showHistory}
        onClearAllHistory={onClearAllHistory}
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
          onDeleteThread={onDeleteThread}
          onClose={() => setShowHistory(false)}
          historyQuery={historyQuery}
          setHistoryQuery={setHistoryQuery}
        />
      )}

      {/* 全削除確認モーダル */}
      <DeleteAllConfirmModal
        isOpen={showDeleteAllModal}
        onConfirm={handleConfirmDeleteAll}
        onCancel={handleCancelDeleteAll}
      />
    </div>
  );
}
