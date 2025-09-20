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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user, signOut } = useAuth();

  // クライアントサイドでのみ実行されることを保証
  useEffect(() => {
    setIsClient(true);
  }, []);

  const extendedMenuItems: ExtendedMenuItem[] = [
    { icon: Clock, label: "Clock", href: "/glok", color: "text-yellow-400" },
    { icon: Heart, label: "リアクション", href: "/reactions", color: "text-pink-400" },
    { icon: Camera, label: "REALction", href: "/realction", color: "text-purple-400" },
    { icon: CloudSun, label: "天気Yahoo!", href: "/weather", color: "text-blue-400" },
    { icon: Wine, label: "TikuriBAR", href: "/tikuribar", color: "text-amber-400" },
    { icon: Settings, label: "設定", href: "/settings", color: "text-gray-400" },
    ...(user ? [{ 
      icon: LogOut, 
      label: "ログアウト", 
      href: "#", 
      color: "text-red-400",
      isLogout: true 
    }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleItemClick = (item: ExtendedMenuItem) => {
    if (item.isLogout) {
      signOut();
    }
    // メニューを閉じる（アニメーション付き）
    handleClose();
  };

  const handleToggle = () => {
    if (isExpanded) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleOpen = () => {
    setIsAnimating(true);
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsAnimating(true);
    // アニメーション時間後に状態を更新
    setTimeout(() => {
      setIsExpanded(false);
      setIsAnimating(false);
    }, 300); // アニメーション時間と同期
  };

  // オーバーレイクリックでメニューを閉じる
  const handleOverlayClick = () => {
    if (isExpanded) {
      handleClose();
    }
  };

  return (
    <>
      {/* 拡張メニュー */}
      {(isExpanded || isAnimating) && isClient && (
        <div 
          className={`lg:hidden fixed bottom-24 right-3 z-40 transition-all duration-300 transform ${
            isExpanded && !isAnimating
              ? "animate-in slide-in-from-bottom-2 opacity-100 scale-100"
              : isAnimating && !isExpanded
              ? "animate-out slide-out-to-bottom-2 opacity-0 scale-95"
              : "opacity-100 scale-100"
          }`}
          style={{
            animation: isAnimating && !isExpanded 
              ? 'slideOutToBottom 0.3s ease-in forwards' 
              : isExpanded && !isAnimating
              ? 'slideInFromBottom 0.3s ease-out forwards'
              : undefined
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-3 space-y-2 min-w-[180px] max-h-[60vh] overflow-y-auto">
            {/* メニューヘッダー */}
            <div className="px-2 py-1 border-b border-gray-700 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                その他のメニュー
              </span>
            </div>
            
            {extendedMenuItems.map((item, index) => (
              <div 
                key={item.label}
                style={{
                  animationDelay: isExpanded && !isAnimating ? `${index * 50}ms` : '0ms',
                  animation: isExpanded && !isAnimating 
                    ? 'slideInFromRight 0.3s ease-out forwards'
                    : isAnimating && !isExpanded
                    ? `slideOutToRight 0.3s ease-in forwards`
                    : undefined
                }}
              >
                {item.isLogout ? (
                  <button
                    onClick={() => handleItemClick(item)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-300 hover:bg-red-900/80 hover:text-red-300 hover:scale-105 w-full text-left"
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
          onClick={handleToggle}
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
            <div className={`transition-all duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
              {isExpanded ? (
                <X size={20} className="text-white" />
              ) : (
                <MoreHorizontal size={20} />
              )}
            </div>
          </div>
          
          {/* 状態インジケーター */}
          <div className={`absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 transition-all duration-300 ${
            isExpanded ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}></div>
        </button>
      </div>

      {/* オーバーレイ */}
      {(isExpanded || isAnimating) && (
        <div 
          className={`lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-all duration-300 ${
            isExpanded && !isAnimating ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleOverlayClick}
        />
      )}
    </>
  );
}
