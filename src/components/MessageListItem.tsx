import React from 'react'

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
  
  export default function MessageListItem({ user, onClick }: MessageListItemProps) {
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


