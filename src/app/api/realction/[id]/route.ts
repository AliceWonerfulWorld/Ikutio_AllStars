// app/api/realction/[id]/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

function hexToUint8(hex: string) {
  const clean = hex.startsWith('\\x') ? hex.slice(2) : hex;
  const len = clean.length / 2;
  const out = new Uint8Array(len);
  // substr → substring に修正
  for (let i = 0; i < len; i++) out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  return out;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // params を await で解決
  const params = await context.params;
  
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() { /* noop: Next.js manages cookies */ },
        remove() { /* noop */ },
      },
    }
  );

  // RLSにより、ログイン済み & 自分の行のみ取得可能
  const { data, error } = await supabase
    .from('realction')
    .select('bytes,mime')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return new Response('Not found', { status: 404 });
  }

  const bin = hexToUint8(data.bytes as unknown as string);
  return new Response(bin, {
    headers: {
      'Content-Type': data.mime || 'image/jpeg',
      // 好みでキャッシュ調整
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
