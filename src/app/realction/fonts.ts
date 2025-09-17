// app/gallery/fonts.ts
// src/app/realction/fonts.ts
import { Inter, Noto_Sans_JP } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '600', '800'],
});

export const notoJP = Noto_Sans_JP({
  subsets: ['latin'],      // Noto Sans JP は subsets は 'latin' でOK
  display: 'swap',
  weight: ['400', '700'],
});
