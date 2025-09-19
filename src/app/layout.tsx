import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabase/client";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tikuru24",
  description: "Tikuru24 - 瞬間で繋がるSNS",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tikuru24",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Tikuru24",
    title: "Tikuru24",
    description: "Tikuru24 - 瞬間で繋がるSNS",
  },
  twitter: {
    card: "summary",
    title: "Tikuru24",
    description: "Tikuru24 - 瞬間で繋がるSNS",
  },
  icons: {
    icon: '/tikuru24-favicon.ico',
    shortcut: '/tikuru24-icon-192.png',
    apple: '/tikuru24-icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ikutio AllStars" />
        <link rel="apple-touch-icon" href="/android-launchericon-192-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <ServiceWorkerRegistration />
        </AuthProvider>
      </body>
    </html>
  );
}
