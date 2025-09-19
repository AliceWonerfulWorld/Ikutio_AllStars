import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import LoadingScreenWrapper from "@/components/LoadingScreenWrapper";

const inter = Inter({ subsets: ["latin"] });

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <LoadingScreenWrapper>
            {children}
          </LoadingScreenWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
