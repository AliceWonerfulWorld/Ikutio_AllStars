"use client";

import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  Clock,
  Heart,
  CloudSun,
  Wine,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function MobileNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  // 現在のパスがアクティブかどうかを判定する関数
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // モバイル用の主要メニューアイテム
  const mobileMenuItems = [
    { icon: Home, label: "ホーム", href: "/" },
    { icon: Search, label: "検索", href: "/search" },
    { icon: Bell, label: "通知", href: "/notifications" },
    { icon: Mail, label: "メッセージ", href: "/messages" },
    { icon: User, label: "プロフィール", href: "/profile" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="flex items-center justify-around py-2 px-4">
        {mobileMenuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              isActive(item.href)
                ? "text-white"
                : "text-gray-500 hover:text-white"
            }`}
          >
            <item.icon 
              size={24} 
              className={`mb-1 ${
                isActive(item.href) ? "text-blue-500" : ""
              }`}
            />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
