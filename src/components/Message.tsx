import { Message as MessageType } from '@/types'

interface MessageProps {
  message: MessageType
}

export default function Message({ message }: MessageProps) {
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
    <div className="p-4 hover:bg-gray-900/50 transition-colors border-b border-gray-800">
      <div className="flex space-x-3">
        {/* アバター */}
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold">
          {getAvatarLetter(message.username)}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* ユーザー情報 */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-white hover:underline cursor-pointer">
              {message.username || 'Unknown User'}
            </span>
            <span className="text-gray-500 text-sm">
              @{message.username || 'unknown'}
            </span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-gray-500 text-sm">
              {formatDate(message.created_at)}
            </span>
          </div>
          
          {/* メッセージ内容 */}
          <div className="text-white mb-3 whitespace-pre-wrap leading-relaxed">
            {message.text}
          </div>
        </div>
      </div>
    </div>
  )
}

