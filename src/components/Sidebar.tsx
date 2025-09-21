"use client";
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  Settings,
  LogOut,
  Clock,
  Heart,
  CloudSun,
  Wine,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

// R2のパブリック開発URL
const R2_PUBLIC_URL = "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

// 画像URLを生成（Post.tsxと同じロジック）
const getImageUrl = (image_url?: string) => {
  if (!image_url) return "";
  // pub-...r2.dev 形式 or http(s) ならそのまま
  if (image_url.startsWith("http://") || image_url.startsWith("https://pub-")) {
    return image_url;
  }
  // r2.cloudflarestorage.com 形式ならファイル名部分だけ抽出
  if (image_url.includes("r2.cloudflarestorage.com")) {
    // 末尾のファイル名部分を抽出
    const parts = image_url.split("/");
    const filename = parts[parts.length - 1];
    return `${R2_PUBLIC_URL}${filename}`;
  }
  // ファイル名のみ
  const trimmed = image_url.trim();
  return `${R2_PUBLIC_URL}${trimmed}`;
};

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドでのみ実行されることを保証
  useEffect(() => {
    setIsClient(true);
  }, []);

  // uselsテーブルから追加情報を取得
  const [userMeta, setUserMeta] = useState<{
    setID?: string;
    icon_url?: string;
    username?: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserMeta = async () => {
      if (!user || !isClient) return;
      try {
        const { data, error } = await supabase
          .from("usels")
          .select("setID, icon_url, username")
          .eq("user_id", user.id)
          .single();
        if (!error && data) {
          setUserMeta(data);
        } else {
          setUserMeta(null);
        }
      } catch (error) {
        console.error("Error fetching user meta:", error);
        setUserMeta(null);
      }
    };
    fetchUserMeta();
  }, [user, isClient]);

  const menuItems = [
    { icon: Home, label: "ホーム", href: "/" },
    { icon: Search, label: "検索", href: "/search" },
    { icon: Bell, label: "通知", href: "/notifications" },
    { icon: Mail, label: "メッセージ", href: "/messages" },
    { icon: Bookmark, label: "ブックマーク", href: "/bookmarks" },
    { icon: Clock, label: "Clock", href: "/glok" },
    { icon: Heart, label: "リアクション", href: "/reactions" },
    { icon: Camera, label: "REALction", href: "/realction" },
    { icon: CloudSun, label: "天気Yohoo!", href: "/weather" },
    { icon: Wine, label: "TikuriBAR", href: "/tikuribar" },
    { icon: User, label: "プロフィール", href: "/profile" },
    { icon: Settings, label: "設定", href: "/settings" },
  ];

  // 現在のパスがアクティブかどうかを判定する関数
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // デスクトップサイドバーのみ表示
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:border-r lg:border-gray-800 lg:sticky lg:top-0 lg:overflow-hidden lg:z-10 lg:bg-black">
      {/* ロゴ */}
      <div className="flex-shrink-0 p-4 relative z-10">
        <h1 className="text-2xl font-bold text-white">Tikuru24</h1>
      </div>

      {/* メニュー（スクロール可能） */}
      <nav className="flex-1 px-4 overflow-y-auto overflow-x-hidden sidebar-scroll relative z-10">
        <ul className="space-y-2 pb-4">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`flex items-center space-x-4 px-4 py-3 rounded-full transition-colors relative z-10 ${
                  isActive(item.href)
                    ? "text-white font-semibold bg-gray-800"
                    : "text-gray-500 hover:text-white hover:bg-gray-800"
                }`}
              >
                <item.icon size={24} />
                <span className="text-lg whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ユーザー情報（固定） */}
      <div className="flex-shrink-0 p-4 border-t border-gray-800 relative z-10">
        {user && isClient ? (
          <Link
            href="/profile"
            className="flex items-center space-x-3 p-3 rounded-full hover:bg-gray-800 transition-colors cursor-pointer block"
          >
            {/* アイコン画像表示 */}
            {userMeta?.icon_url ? (
              (() => {
                const url = getImageUrl(userMeta.icon_url);
                return (
                  <img
                    src={url}
                    alt="ユーザーアイコン"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                );
              })()
            ) : user.user_metadata?.iconUrl ? (
              <img
                src={user.user_metadata.iconUrl}
                alt="ユーザーアイコン"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {userMeta?.username?.charAt(0) ||
                  user.user_metadata?.displayName?.charAt(0) ||
                  user.user_metadata?.username?.charAt(0) ||
                  user.email?.charAt(0) ||
                  "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold truncate">
                {userMeta?.username ||
                  user.user_metadata?.displayName ||
                  user.user_metadata?.username ||
                  user.email ||
                  "ユーザー"}
              </div>
              <div className="text-gray-400 text-sm truncate">
                @
                {userMeta?.setID ||
                  userMeta?.username ||
                  user.user_metadata?.username ||
                  user.email ||
                  "user"}
              </div>
            </div>
          </Link>
        ) : (
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-blue-400 hover:text-blue-300"
            >
              ログイン
            </Link>
          </div>
        )}

        {/* ログアウトボタン */}
        {user && isClient && (
          <button
            onClick={handleSignOut}
            className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
          >
            <LogOut size={20} />
            <span>ログアウト</span>
          </button>
        )}
      </div>
    </div>
  );
}
