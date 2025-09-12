import { Home, Search, Bell, Mail, Bookmark, User, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function Sidebar() {
  const menuItems = [
    { icon: Home, label: 'ホーム', href: '/', active: true },
    { icon: Search, label: '検索', href: '/search' },
    { icon: Bell, label: '通知', href: '/notifications' },
    { icon: Mail, label: 'メッセージ', href: '/messages' },
    { icon: Bookmark, label: 'ブックマーク', href: '/bookmarks' },
    { icon: User, label: 'プロフィール', href: '/profile' },
    { icon: Settings, label: '設定', href: '/settings' },
  ]

  return (
    <div className="w-64 h-screen flex flex-col border-r border-gray-800 sticky top-0">
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
                    ? 'text-white font-semibold'
                    : 'text-gray-500 hover:text-white hover:bg-gray-800'
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
        <div className="flex items-center space-x-3 p-3 rounded-full hover:bg-gray-800 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold">ユーザー</div>
            <div className="text-gray-500 text-sm">@user</div>
          </div>
          <div className="flex space-x-2">
            <Link href="/settings" className="text-gray-500 hover:text-white transition-colors">
              <Settings size={18} />
            </Link>
            <button className="text-gray-500 hover:text-white transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}