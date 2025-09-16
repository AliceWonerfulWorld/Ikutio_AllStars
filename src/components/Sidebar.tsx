import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  Heart, // ← リアクション用のアイコンを追加
  CloudSun, // ← 天気用のアイコンを追加
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const menuItems = [
    { icon: Home, label: "ホーム", href: "/", active: true },
    { icon: Search, label: "検索", href: "/search" },
    { icon: Bell, label: "通知", href: "/notifications" },
    { icon: Mail, label: "メッセージ", href: "/messages" },
    { icon: Bookmark, label: "ブックマーク", href: "/bookmarks" },
    { icon: Clock, label: "Grok", href: "/glok" },
    { icon: Heart, label: "リアクション", href: "/reactions" }, // ← 追加
    { icon: CloudSun, label: "天気", href: "/weather" }, // ← 追加
    { icon: User, label: "プロフィール", href: "/profile" },
    { icon: Settings, label: "設定", href: "/settings" },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* モバイルメニューボタン */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-black/80 backdrop-blur-md text-white p-2 rounded-lg"
      >
        <Menu size={24} />
      </button>

      {/* デスクトップサイドバー */}
      <div className="hidden lg:block w-64 h-screen flex flex-col border-r border-gray-800 sticky top-0">
        {/* ロゴ */}
        <div className="p-4">
          <h1 className="text-2xl font-bold text-white">Ikutio</h1>
        </div>

        {/* メニュー */}
        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-4 px-4 py-3 rounded-full transition-colors ${
                    item.active
                      ? "text-white font-semibold"
                      : "text-gray-500 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <item.icon size={24} />
                  <span className="text-lg">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ユーザー情報 */}
        <div className="p-4 border-t border-gray-800">
          {user ? (
            <div className="flex items-center space-x-3 p-3 rounded-full hover:bg-gray-800 transition-colors cursor-pointer">
              {/* アイコン画像表示 */}
              {user.user_metadata?.iconUrl ? (
                <img
                  src={user.user_metadata.iconUrl}
                  alt="ユーザーアイコン"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.user_metadata?.displayName?.charAt(0) ||
                    user.email?.charAt(0) ||
                    "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold">
                  {user.user_metadata?.displayName || "ユーザー"}
                </div>
                <div className="text-gray-500 text-sm">
                  @{user.user_metadata?.username || "user"}
                </div>
              </div>
              <div className="flex space-x-2">
                <Link
                  href="/settings"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <Settings size={18} />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-white transition-colors"
                  title="ログアウト"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/auth/login"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-semibold transition-colors block text-center"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signup"
                className="w-full border border-gray-600 text-white hover:bg-gray-800 px-4 py-2 rounded-full font-semibold transition-colors block text-center"
              >
                サインアップ
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* モバイルサイドバー */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* サイドバー */}
          <div className="absolute left-0 top-0 w-64 h-full bg-black border-r border-gray-800 flex flex-col">
            {/* ヘッダー */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">Ikutio</h1>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* メニュー */}
            <nav className="flex-1 px-4 py-4">
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-4 px-4 py-3 rounded-full transition-colors ${
                        item.active
                          ? "text-white font-semibold"
                          : "text-gray-500 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <item.icon size={24} />
                      <span className="text-lg">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ユーザー情報（モバイル） */}
            <div className="p-4 border-t border-gray-800">
              {user ? (
                <div className="flex items-center space-x-3 p-3 rounded-full hover:bg-gray-800 transition-colors cursor-pointer">
                  {/* アイコン画像表示 */}
                  {user.user_metadata?.iconUrl ? (
                    <img
                      src={user.user_metadata.iconUrl}
                      alt="ユーザーアイコン"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.user_metadata?.displayName?.charAt(0) ||
                        user.email?.charAt(0) ||
                        "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold">
                      {user.user_metadata?.displayName || "ユーザー"}
                    </div>
                    <div className="text-gray-500 text-sm">
                      @{user.user_metadata?.username || "user"}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href="/settings"
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <Settings size={18} />
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-gray-500 hover:text-white transition-colors"
                      title="ログアウト"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-semibold transition-colors block text-center"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full border border-gray-600 text-white hover:bg-gray-800 px-4 py-2 rounded-full font-semibold transition-colors block text-center"
                  >
                    サインアップ
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
