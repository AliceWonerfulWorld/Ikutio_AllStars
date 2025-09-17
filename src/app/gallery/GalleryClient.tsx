'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import DbImage from './DbImage';

type Item = { id: string; mime: string; created_at: string };

export default function GalleryClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const imagesEndpoint = useMemo(() => (id: string) => `/api/realction/${id}`, []);

  const refresh = useCallback(async () => {
    setMsg(null);
    const { data, error } = await supabase
      .from('realction')
      .select('id,mime,created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      setMsg(error.message);
      setItems([]);
      return;
    }
    setItems((data || []) as Item[]);
  }, []);

  // セッション確認（初回）＆ auth 状態監視
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setAuthed(!!session);
      setChecking(false);
      if (session) refresh();
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      if (session) refresh();
      else setItems([]);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refresh]);

  const signInOAuth = async (provider: 'github' | 'google') => {
    const redirectTo = `${location.origin}/gallery`; // ログイン後はギャラリーに戻す
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSelected(null);
    setItems([]);
  };

  return (
    <>
      {/* 黒背景（全画面。layout/globalsは触らない） */}
      <div
        aria-hidden
        style={{ position: 'fixed', inset: 0, background: '#000', pointerEvents: 'none', zIndex: 0 }}
      />

      <div style={{ position: 'relative', zIndex: 1, color: '#fff', padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>撮った画像のギャラリー</h1>
          {authed ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={refresh} style={{ padding: '8px 12px', borderRadius: 8 }}>更新</button>
              <button onClick={signOut} style={{ padding: '8px 12px', borderRadius: 8 }}>ログアウト</button>
            </div>
          ) : null}
        </header>

        {/* 状態 */}
        {checking && <p>セッション確認中…</p>}

        {!checking && !authed && (
          <section>
            <p>このページを表示するにはログインが必要です。</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => signInOAuth('github')} style={{ padding: '10px 14px', borderRadius: 8 }}>
                GitHubでログイン
              </button>
              <button onClick={() => signInOAuth('google')} style={{ padding: '10px 14px', borderRadius: 8 }}>
                Googleでログイン
              </button>
            </div>
            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
              * Supabase の認証プロバイダ設定で該当プロバイダを有効にし、リダイレクトURLに
              <code> {`{YOUR_DOMAIN}/auth/v1/callback`}</code> と <code>{`{YOUR_DOMAIN}/gallery`}</code>
              を追加してください。
            </p>
          </section>
        )}

        {!checking && authed && (
          <>
            {msg && <p style={{ color: '#60a5fa' }}>{msg}</p>}

            {/* サムネイルグリッド */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 12,
              }}
            >
              {items.map((it) => (
                <figure
                  key={it.id}
                  style={{
                    margin: 0, background: '#0b0b0b', borderRadius: 10, padding: 8, border: '1px solid #1f2937',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelected(it)}
                >
                  <DbImage
                    id={it.id}
                    style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 6 }}
                  />
                  <figcaption style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                    {new Date(it.created_at).toLocaleString()}
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
      </div>

      {/* モーダル（拡大表示） */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'grid', placeItems: 'center',
            background: 'rgba(0,0,0,0.6)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(90vw, 720px)',
              background: '#0b0b0b',
              borderRadius: 12,
              border: '1px solid #334155',
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong>拡大表示</strong>
              <button onClick={() => setSelected(null)} style={{ padding: '6px 10px', borderRadius: 8 }}>
                閉じる（Esc）
              </button>
            </div>
            <DbImage
               id={selected.id}
               style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
              {new Date(selected.created_at).toLocaleString()} / {selected.mime}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
