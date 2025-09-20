"use client";

import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  LogIn,
  Clock,
  Heart,
  CloudSun,
  Wine,
  Camera,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

// メニューアイテムの型定義
interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  isAuth?: boolean;
  hasNotification?: boolean;
}

export default function MobileNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドでのみ実行されることを保証
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 現在のパスがアクティブかどうかを判定する関数
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // ログイン状態に応じたメニューアイテム
  const getMobileMenuItems = (): MenuItem[] => {
    if (!user) {
      // 未ログイン時のメニュー
      return [
        { icon: Home, label: "ホーム", href: "/" },
        { icon: Search, label: "検索", href: "/search" },
        { icon: Bell, label: "通知", href: "/notifications" },
        { icon: LogIn, label: "ログイン", href: "/auth/login", isAuth: true },
        { icon: User, label: "サインアップ", href: "/auth/signup", isAuth: true },
      ];
    } else {
      // ログイン時のメニュー
      return [
        { icon: Home, label: "ホーム", href: "/", hasNotification: true },
        { icon: Search, label: "検索", href: "/search" },
        { icon: Bell, label: "通知", href: "/notifications", hasNotification: false },
        { icon: Mail, label: "メッセージ", href: "/messages", hasNotification: false },
        { icon: User, label: "プロフィール", href: "/profile" },
      ];
    }
  };

  const mobileMenuItems = getMobileMenuItems();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-gray-800 z-50 safe-area-pb">
      <div className="flex items-center justify-between px-2 py-2 max-w-md mx-auto">
        {mobileMenuItems.map((item, index) => (
          <Link
            key={item.label}
            href={item.href}
            className={`relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-xl transition-all duration-200 ${
              isActive(item.href)
                ? "text-white bg-gray-800/50 scale-105"
                : item.isAuth
                ? "text-green-400 hover:text-green-300 hover:bg-green-900/30"
                : "text-gray-500 hover:text-white hover:bg-gray-800/30"
            }`}
          >
            {/* アイコンコンテナ */}
            <div className="relative mb-1">
              <item.icon 
                size={22} 
                className={`transition-colors duration-200 ${
                  isActive(item.href) 
                    ? "text-blue-400" 
                    : item.isAuth 
                    ? "text-green-400" 
                    : ""
                }`}
              />
              
              {/* 通知バッジ */}
              {item.hasNotification && isClient && user && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  N
                </div>
              )}
              
              {/* アクティブ状態のインジケーター */}
              {isActive(item.href) && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>
              )}
            </div>
            
            {/* ラベル */}
            <span className={`text-xs font-medium text-center leading-tight transition-colors duration-200 ${
              isActive(item.href) 
                ? "text-blue-400" 
                : item.isAuth 
                ? "text-green-400" 
                : ""
            }`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
