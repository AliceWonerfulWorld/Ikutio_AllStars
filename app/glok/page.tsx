'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; text: string };
type Thread = { id: string; title: string; messages: Msg[]; createdAt: number };

const LS_KEY = 'glok_history_v1';

/* ================== 星の背景 ================== */
function Starfield({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return; // 最初の画面のときだけ動かす
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    // DPR対応＆リサイズ
    const fit = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const { clientWidth, clientHeight } = canvas.parentElement!;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      canvas.style.width = clientWidth + 'px';
      canvas.style.height = clientHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas.parentElement!);

    // 星データ
    type Star = { x: number; y: number; r: number; vx: number; vy: number; a: number };
    const stars: Star[] = [];
    const makeStarsCount = () => {
      // 画面サイズに応じて密度を決める
      const area = (canvas.width * canvas.height) / (window.devicePixelRatio || 1);
      return Math.min(220, Math.max(80, Math.floor(area / 35000)));
    };

    const spawnStar = (edge?: 'left' | 'bottom') => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      // 左下→右上 方向（右上へ遅く流れる）
      const speed = 0.15 + Math.random() * 0.35; // px/frame 程度
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.3; // だいたい45°で上向き
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      let x = Math.random() * w;
      let y = Math.random() * h;
      if (edge === 'left') {
        x = -10; // 左端外から
        y = h * (0.7 + Math.random() * 0.3); // 画面下寄りから上がっていく
      } else if (edge === 'bottom') {
        x = w * (0.0 + Math.random() * 0.3);
        y = h + 10; // 下端外から
      }

      const r = Math.random() * 1.6 + 0.4; // 半径
      const a = 0.6 + Math.random() * 0.4; // 透明度
      return { x, y, r, vx, vy, a };
    };

    const ensureStars = () => {
      const target = makeStarsCount();
      while (stars.length < target) stars.push(spawnStar(Math.random() < 0.5 ? 'left' : 'bottom'));
      if (stars.length > target) stars.length = target;
    };
    ensureStars();

    // 流れ星
    type Meteor = { x: number; y: number; vx: number; vy: number; life: number; len: number };
    const meteors: Meteor[] = [];
    const spawnMeteor = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      // 右上→左下（下り方向に速い）
      const speed = 6 + Math.random() * 5; // 速い
      const angle = (135 * Math.PI) / 180 + (Math.random() - 0.5) * 0.15; // おおむね左下へ
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const margin = 80;
      const x = w - Math.random() * margin;
      const y = Math.random() * margin; // 右上付近から
      const len = 60 + Math.random() * 80;
      const life = 40 + Math.random() * 30; // フレーム数
      meteors.push({ x, y, vx, vy, life, len });
    };

    let meteorTimer = 0;

    const step = () => {
      if (!running) return;

      // 背景クリア（黒にフェード）
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      ensureStars();

      // 通常の星：左下→右上
      ctx.save();
      for (let s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        // 右か上にはけたら再スポーン
        if (s.x - 4 > canvas.clientWidth || s.y + 4 < 0) {
          const edge = Math.random() < 0.5 ? 'left' : 'bottom';
          const newbie = spawnStar(edge);
          s.x = newbie.x; s.y = newbie.y; s.vx = newbie.vx; s.vy = newbie.vy; s.r = newbie.r; s.a = newbie.a;
        }
        ctx.globalAlpha = s.a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      ctx.restore();

      // 稀に流れ星（右上→左下）
      meteorTimer++;
      // 平均 12〜20 秒に1回くらい
      const chance = 0.004; // 1frameの確率をとても低く
      if (Math.random() < chance) spawnMeteor();

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 1;
        // しっぽを描く（線）
        const nx = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.len;
        const ny = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.len;
        const grad = ctx.createLinearGradient(m.x, m.y, nx, ny);
        grad.addColorStop(0, 'rgba(255,255,255,0.95)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        if (m.life <= 0 || m.x + 100 < 0 || m.y - 100 > canvas.clientHeight) {
          meteors.splice(i, 1);
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

/* ================== メインページ ================== */

export default function GlokPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setThreads(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(threads));
    } catch {}
  }, [threads]);

  const currentThread = useMemo(
    () => threads.find((t) => t.id === currentId) || null,
    [threads, currentId]
  );
  const hasAsked = !!currentThread && currentThread.messages.length > 0;

  const startNewThread = () => {
    const id = String(Date.now());
    const t: Thread = { id, title: '新しいチャット', messages: [], createdAt: Date.now() };
    setThreads((p) => [t, ...p]);
    setCurrentId(id);
  };
  const pushMessage = (id: string, msg: Msg) => {
    setThreads((p) => p.map((t) => (t.id === id ? { ...t, messages: [...t.messages, msg] } : t)));
  };
  const updateTitleIfNeeded = (id: string, firstUserText: string) => {
    setThreads((p) =>
      p.map((t) =>
        t.id === id && t.title === '新しいチャット'
          ? { ...t, title: makeTitle(firstUserText) }
          : t
      )
    );
  };
  const makeTitle = (txt: string) => (txt || '無題').replace(/\s+/g, ' ').slice(0, 30);

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    let id = currentId;
    if (!id) {
      const newId = String(Date.now());
      const t: Thread = { id: newId, title: '新しいチャット', messages: [], createdAt: Date.now() };
      setThreads((p) => [t, ...p]);
      id = newId;
      setCurrentId(newId);
    }
    pushMessage(id!, { role: 'user', text: prompt });
    updateTitleIfNeeded(id!, prompt);

    try {
      const res = await fetch('/api/gemini-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_post: prompt }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const msg = ct.includes('application/json')
          ? (await res.json()).error ?? `HTTP ${res.status}`
          : await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = await res.json();
      pushMessage(id!, { role: 'assistant', text: data.response ?? '' });
      setPrompt('');
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const goHome = () => {
    setCurrentId(null);
    setPrompt('');
    setError(null);
  };

  const filteredThreads = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  }, [threads, historyQuery]);

  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      {/* ヘッダー */}
      <header
        style={{
          position: 'fixed',
          top: 0, right: 0, left: 0,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0))',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={goHome} title="ホーム" style={chipBtnStyle}>ホーム</button>
          <button onClick={() => setShowHistory(true)} title="履歴" style={chipBtnStyle}>履歴</button>
        </div>
      </header>

      {/* 本文 */}
      <main
        style={{
          position: 'relative',
          paddingTop: 80,
          paddingBottom: 120,
          minHeight: '100vh',
          display: 'flex',
          alignItems: hasAsked ? 'flex-start' : 'center',
          justifyContent: 'center',
        }}
      >
        {/* 最初の画面専用：星のキャンバス */}
        {!currentThread && <Starfield active={!currentThread} />}

        {!currentThread ? (
          <StartView
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            onSend={handleSend}
          />
        ) : (
          <ChatView
            thread={currentThread}
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            error={error}
            onSend={handleSend}
            onKeyDown={onKeyDown}
          />
        )}
      </main>

      {/* 履歴ドロワー */}
      {showHistory && (
        <>
          <div
            onClick={() => setShowHistory(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 30 }}
          />
          <aside
            style={{
              position: 'fixed',
              right: 0, top: 0, bottom: 0,
              width: 360,
              background: '#0b0b0b',
              borderLeft: '1px solid #222',
              zIndex: 31,
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div
              style={{
                height: 56, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 16px',
                borderBottom: '1px solid #1f1f1f',
              }}
            >
              <strong style={{ fontSize: 18 }}>履歴</strong>
              <button onClick={() => setShowHistory(false)} style={chipBtnStyle}>閉じる</button>
            </div>

            <div style={{ padding: 12 }}>
              <input
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Grokの履歴を検索"
                style={searchInputStyle}
              />
            </div>

            <div style={{ overflowY: 'auto', padding: '0 8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredThreads.length === 0 && (
                <div style={{ color: '#888', padding: '8px 12px' }}>履歴がありません</div>
              )}
              {filteredThreads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setCurrentId(t.id); setShowHistory(false); }}
                  style={historyItemStyle}
                >
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: '#9aa', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {t.messages[0]?.text ?? ''}
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

/* ================== ビュー ================== */

function StartView({
  prompt, setPrompt, loading, onSend,
}: {
  prompt: string; setPrompt: (v: string) => void; loading: boolean; onSend: () => void;
}) {
  return (
    <div style={{ textAlign: 'center', width: '100%', position: 'relative', zIndex: 1 }}>
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            fontSize: 64, fontWeight: 800, letterSpacing: 1,
            display: 'inline-flex', alignItems: 'center', gap: 12,
          }}
        >
          <span aria-hidden style={{ display: 'inline-block', width: 36, height: 36, borderRadius: '50%', border: '3px solid #fff', position: 'relative' }}>
            <span style={{ position: 'absolute', left: -6, top: '50%', width: 24, height: 3, background: '#fff', transform: 'translateY(-50%) rotate(-25deg)' }} />
          </span>
          Grok
        </div>
      </div>

      <div style={{ display: 'inline-flex', gap: 8 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="どんなことでもお尋ねください"
          style={inputBarStyle}
        />
        <button onClick={onSend} disabled={loading} style={sendBtnStyle}>
          {loading ? '送信中…' : '↑'}
        </button>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button style={pillBtnStyle}>画像を作成</button>
        <button style={pillBtnStyle}>画像を編集</button>
      </div>
    </div>
  );
}

function ChatView({
  thread, prompt, setPrompt, loading, error, onSend, onKeyDown,
}: {
  thread: Thread; prompt: string; setPrompt: (v: string) => void; loading: boolean; error: string | null; onSend: () => void; onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div style={{ width: '100%', maxWidth: 900, padding: '0 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {thread.messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? '#222831' : '#101215',
              border: '1px solid #1f2024',
              borderRadius: 16,
              padding: '12px 14px',
              maxWidth: '80%',
              color: '#e6e6e6',
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          padding: 16, display: 'flex', justifyContent: 'center',
          background: 'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0))',
        }}
      >
        <div style={{ display: 'flex', gap: 8, width: 'min(900px, 92%)' }}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="どんなことでもお尋ねください"
            style={inputBarStyle}
          />
          <button onClick={onSend} disabled={loading} style={sendBtnStyle}>
            {loading ? '送信中…' : '↑'}
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'crimson', marginTop: 12 }}>エラー: {error}</div>}
    </div>
  );
}

/* ================== スタイル共通 ================== */

const chipBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: '#0f1216',
  color: '#ddd',
  border: '1px solid #2a2f36',
  borderRadius: 999,
  cursor: 'pointer',
};

const pillBtnStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: '#12161c',
  color: '#cfd6dd',
  border: '1px solid #2a2f36',
  borderRadius: 999,
};

const inputBarStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 340,
  padding: '14px 16px',
  borderRadius: 16,
  border: '1px solid #2a2f36',
  background: '#0e1116',
  color: '#e9eef5',
  outline: 'none',
};

const sendBtnStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  border: '1px solid #2a2f36',
  background: '#1b2129',
  color: '#cfd6dd',
  cursor: 'pointer',
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid #2a2f36',
  background: '#0e1116',
  color: '#e9eef5',
  outline: 'none',
};

const historyItemStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  background: '#0e1116',
  border: '1px solid #1f242b',
  borderRadius: 10,
  color: '#e6e6e6',
  cursor: 'pointer',
};
