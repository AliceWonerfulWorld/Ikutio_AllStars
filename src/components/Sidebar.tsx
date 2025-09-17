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
  Heart,
  CloudSun,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { icon: Home, label: "ホーム", href: "/" },
    { icon: Search, label: "検索", href: "/search" },
    { icon: Bell, label: "通知", href: "/notifications" },
    { icon: Mail, label: "メッセージ", href: "/messages" },
    { icon: Bookmark, label: "ブックマーク", href: "/bookmarks" },
    { icon: Clock, label: "Clock", href: "/glok" },
    { icon: Heart, label: "リアクション", href: "/reactions" },
    { icon: CloudSun, label: "天気", href: "/weather" },
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

  return (
    <>
      {/* モバイルメニューボタン */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-black/80 backdrop-blur-md text-white p-2 rounded-lg"
      >
        <Menu size={24} />
      </button>

      {/* モバイルメニューオーバーレイ */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40">
          <div className="w-80 h-full bg-black border-r border-gray-800 flex flex-col">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h1 className="text-2xl font-bold text-white">Tikuru24</h1>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* メニュー */}
            <nav className="flex-1 px-4 py-4 overflow-y-auto">
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-4 px-4 py-3 rounded-full transition-colors ${
                        isActive(item.href)
                          ? "text-white font-semibold bg-gray-800"
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
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user.user_metadata?.displayName?.charAt(0) ||
                        user.email?.charAt(0) ||
                        "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate">
                      {user.user_metadata?.displayName || "ユーザー"}
                    </div>
                    <div className="text-gray-400 text-sm truncate">
                      @{user.user_metadata?.username || "user"}
                    </div>
                  </div>
                </div>
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
            </div>
          </div>
        </div>
      )}

      {/* デスクトップサイドバー */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:border-r lg:border-gray-800 lg:sticky lg:top-0 lg:overflow-hidden lg:z-30 lg:bg-black">
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
                  <span className="text-lg whitespace-nowrap">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ユーザー情報（固定） */}
        <div className="flex-shrink-0 p-4 border-t border-gray-800 relative z-10">
          {user ? (
            <div className="flex items-center space-x-3 p-3 rounded-full hover:bg-gray-800 transition-colors cursor-pointer">
              {/* アイコン画像表示 */}
              {user.user_metadata?.iconUrl ? (
                <img
                  src={user.user_metadata.iconUrl}
                  alt="ユーザーアイコン"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.user_metadata?.displayName?.charAt(0) ||
                    user.email?.charAt(0) ||
                    "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold truncate">
                  {user.user_metadata?.displayName || "ユーザー"}
                </div>
                <div className="text-gray-400 text-sm truncate">
                  @{user.user_metadata?.username || "user"}
                </div>
              </div>
            </div>
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
          {user && (
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
    </>
  );
}
