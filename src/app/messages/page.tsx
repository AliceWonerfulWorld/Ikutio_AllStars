'use client'

import { useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { mockMessages } from '@/data/mockMessageData'

// MessageListItemコンポーネントを直接定義
interface User {
  id: string
  username: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface MessageListItemProps {
  user: User
  onClick: () => void
}

function MessageListItem({ user, onClick }: MessageListItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'たった今'
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    }
  }

  const getAvatarLetter = (username: string) => {
    if (!username || username.length === 0) return 'U'
    return username.charAt(0).toUpperCase()
  }

  return (
    <div 
      className="p-4 hover:bg-gray-900/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex space-x-3">
        {/* アバター */}
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold">
            {getAvatarLetter(user.username)}
          </div>
          {user.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {user.unreadCount > 9 ? '9+' : user.unreadCount}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* ユーザー情報 */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-white hover:underline">
              {user.username}
            </span>
            <span className="text-gray-500 text-sm">
              {formatDate(user.lastMessageTime)}
            </span>
          </div>
          
          {/* 最後のメッセージ */}
          <div className="text-gray-400 text-sm truncate">
            {user.lastMessage}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MessagePage() {
  const [messages] = useState(mockMessages)
  const [searchQuery, setSearchQuery] = useState('')

  // メッセージをユーザーごとにグループ化
  const groupedMessages = messages.reduce((acc, message) => {
    const userId = message.user_id
    if (!acc[userId]) {
      acc[userId] = {
        user: {
          id: userId,
          username: message.username,
          lastMessage: message.text,
          lastMessageTime: message.created_at,
          unreadCount: Math.floor(Math.random() * 5) // モック用の未読数
        },
        messages: []
      }
    }
    acc[userId].messages.push(message)
    return acc
  }, {} as Record<string, any>)

  const filteredMessages = Object.values(groupedMessages).filter((group: any) =>
    group.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex max-w-7xl mx-auto">
        {/* 左サイドバー */}
        <div className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
          <Sidebar />
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl lg:border-r border-gray-800">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="hover:bg-gray-800 p-2 rounded-full transition-colors">
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold">メッセージ</h1>
              </div>
              <button className="hover:bg-gray-800 p-2 rounded-full transition-colors">
                <Search size={20} />
              </button>
            </div>
            
            {/* 検索バー */}
            <div className="mt-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="メッセージを検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>
          
          {/* メッセージ一覧 */}
          <div className="divide-y divide-gray-800">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold mb-2">
                  {searchQuery ? '検索結果が見つかりません' : 'メッセージがありません'}
                </h2>
                <p>
                  {searchQuery 
                    ? '別のキーワードで検索してみてください。'
                    : '新しいメッセージが届いたら、ここに表示されます。'
                  }
                </p>
              </div>
            ) : (
              filteredMessages.map((group: any) => (
                <MessageListItem
                  key={group.user.id}
                  user={group.user}
                  onClick={() => {
                    // 個別メッセージ画面に遷移
                    window.location.href = `/messages/${group.user.id}`
                  }}
                />
              ))
            )}
          </div>
        </div>
        
        {/* 右サイドバー - デスクトップのみ */}
        <div className="hidden xl:block w-80 flex-shrink-0 h-screen sticky top-0 p-4">
          <div className="sticky top-4">
            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">メッセージについて</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                届いたメッセージは、このページでいつでも確認できます。内容を読んで、返信することができます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}