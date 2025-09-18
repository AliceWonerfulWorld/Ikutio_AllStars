import { NextResponse } from 'next/server';

// VAPID公開キー（実際の運用では環境変数から取得）
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

export async function GET() {
  return NextResponse.json({ key: VAPID_PUBLIC_KEY });
}
