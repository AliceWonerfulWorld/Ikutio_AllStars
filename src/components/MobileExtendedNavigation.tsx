"use client";

import {
  Clock,
  Heart,
  CloudSun,
  Wine,
  Camera,
  MoreHorizontal,
  X,
  LogOut,
  Settings,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// 拡張メニューアイテムの型定義
interface ExtendedMenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  color: string;
  isLogout?: boolean;
}

export default function MobileExtendedNavigation() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user, signOut } = useAuth();

  // クライアントサイドでのみ実行されることを保証
  useEffect(() => {
    setIsClient(true);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // ログイン状態に応じた拡張メニューアイテム
  const getExtendedMenuItems = (): ExtendedMenuItem[] => {
    const baseItems: ExtendedMenuItem[] = [
      { icon: Clock, label: "Clock", href: "/glok", color: "text-yellow-400" },
      { icon: Heart, label: "リアクション", href: "/reactions", color: "text-pink-400" },
      { icon: Camera, label: "REALction", href: "/realction", color: "text-purple-400" },
      { icon: CloudSun, label: "天気Yohoo!", href: "/weather", color: "text-cyan-400" },
      { icon: Wine, label: "TikuriBAR", href: "/tikuribar", color: "text-green-400" },
    ];

    if (user) {
      // ログイン時は設定とログアウトを追加
      return [
        ...baseItems,
        { icon: Settings, label: "設定", href: "/settings", color: "text-gray-400" },
        { icon: LogOut, label: "ログアウト", href: "#", color: "text-red-400", isLogout: true },
      ];
    }

    return baseItems;
  };

  const extendedMenuItems = getExtendedMenuItems();

  const handleItemClick = async (item: ExtendedMenuItem) => {
    if (item.isLogout) {
      await signOut();
      setIsExpanded(false);
    } else {
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* 拡張メニュー */}
      {isExpanded && isClient && (
        <div className="lg:hidden fixed bottom-24 right-3 z-40 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-3 space-y-2 min-w-[180px] max-h-[60vh] overflow-y-auto">
            {/* メニューヘッダー */}
            <div className="px-2 py-1 border-b border-gray-700 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                その他のメニュー
              </span>
            </div>
            
            {extendedMenuItems.map((item, index) => (
              <div key={item.label}>
                {item.isLogout ? (
                  <button
                    onClick={() => handleItemClick(item)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-300 hover:bg-red-900/80 hover:text-red-300 hover:scale-105 w-full text-left"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'slideInFromRight 0.3s ease-out forwards'
                    }}
                  >
                    <item.icon size={18} className={item.color} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => handleItemClick(item)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-blue-600/80 text-white scale-105"
                        : "text-gray-300 hover:bg-gray-800/80 hover:text-white hover:scale-105"
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'slideInFromRight 0.3s ease-out forwards'
                    }}
                  >
                    <item.icon size={18} className={item.color} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 拡張ボタン - より分かりやすいデザイン */}
      <div className="lg:hidden fixed bottom-0 right-3 mb-20 z-50 safe-area-pb">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative p-3 rounded-full shadow-xl transition-all duration-300 transform ${
            isExpanded
              ? "bg-gray-700 text-gray-300 scale-105 border-2 border-gray-500"
              : user
              ? "bg-blue-500 text-white hover:bg-blue-600 hover:scale-105"
              : "bg-gray-600 text-white hover:bg-gray-700 hover:scale-105"
          }`}
        >
          {/* アイコン */}
          <div className="relative">
            {isExpanded ? (
              <X size={20} className="text-white" />
            ) : (
              <MoreHorizontal size={20} />
            )}
          </div>
          
          {/* 状態インジケーター */}
          {isExpanded && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
          )}
        </button>
      </div>

      {/* オーバーレイ */}
      {isExpanded && isClient && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-30 animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* カスタムCSSアニメーション */}
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
}
