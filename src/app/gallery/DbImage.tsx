// app/gallery/DbImage.tsx
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { supabase } from '@/utils/supabase/client';

type Props = { id: string; alt?: string; style?: CSSProperties; className?: string };

function byteaHexToBlob(hex: string, mime = 'image/jpeg') {
  const clean = hex.startsWith('\\x') ? hex.slice(2) : hex;
  const len = clean.length / 2;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  return new Blob([bytes], { type: mime });
}

export default function DbImage({ id, alt, style, className }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let url: string | null = null;

    (async () => {
      setErr(null);
      // 自分の行だけ読めるRLS前提（auth済み）
      const { data, error } = await supabase
        .from('realction')
        .select('bytes,mime')
        .eq('id', id)
        .single();

      if (error || !data) {
        if (alive) setErr(error?.message ?? 'not found');
        return;
      }

      const blob = byteaHexToBlob((data as any).bytes, (data as any).mime);
      url = URL.createObjectURL(blob);
      if (alive) setSrc(url);
    })();

    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  // ローディング／エラー時のプレースホルダ
  if (!src) {
    return (
      <div
        className={className}
        style={{
          ...style,
          background: '#111',
          borderRadius: 6,
          aspectRatio: '1 / 1',
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          color: '#666',
        }}
        title={err ?? 'loading…'}
      >
        {err ? 'ERR' : ''}
      </div>
    );
  }

  return <img src={src} alt={alt ?? id} className={className} style={style} />;
}
