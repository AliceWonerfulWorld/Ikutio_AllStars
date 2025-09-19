"use client";

import {
  Clock,
  Heart,
  CloudSun,
  Wine,
  Camera,
  MoreHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function MobileExtendedNavigation() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // 拡張メニューのアイテム
  const extendedMenuItems = [
    { icon: Clock, label: "Clock", href: "/glok" },
    { icon: Heart, label: "リアクション", href: "/reactions" },
    { icon: Camera, label: "REALction", href: "/realction" },
    { icon: CloudSun, label: "天気Yohoo!", href: "/weather" },
    { icon: Wine, label: "TikuriBAR", href: "/tikuribar" },
  ];

  return (
    <>
      {/* 拡張ボタン */}
      <div className="lg:hidden fixed bottom-0 right-4 mb-20 z-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
            isExpanded
              ? "bg-red-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isExpanded ? <X size={24} /> : <MoreHorizontal size={24} />}
        </button>
      </div>

      {/* 拡張メニュー */}
      {isExpanded && (
        <div className="lg:hidden fixed bottom-20 right-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-4 space-y-3">
            {extendedMenuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsExpanded(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* オーバーレイ */}
      {isExpanded && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
