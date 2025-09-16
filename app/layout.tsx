// app/layout.tsx
import './globals.css'; // グローバルCSSを使いたい場合。なければ削除してOK

export const metadata = {
  title: 'Ikutio AllStars',
  description: 'Gemini API テスト用アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
