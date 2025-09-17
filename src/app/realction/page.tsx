// app/page.tsx
import WebcamUploader from '@/components/WebcamUploader';
import { inter, notoJP } from './fonts';


export default function Page() {
  return (
    <main className={`${inter.className} ${notoJP.className}`} style={{ letterSpacing: 0.2 }}>
        {/* 背景レイヤー（全画面・黒） */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* コンテンツ（上に載せる / 文字は白） */}
      <section style={{ position: 'relative', zIndex: 1, color: '#fff', padding: 24 }}>
      <h1>REALction</h1>
      <WebcamUploader />
      </section>
    </main>
  );
}