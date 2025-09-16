'use client'

import { useState, useEffect, useRef, use } from 'react'
import { ArrowLeft, Send, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { mockMessages } from '@/data/mockMessageData'

interface Message {
  id: string
  text: string
  user_id: string
  username: string
  created_at: string
  isOwn: boolean
}

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // React.use()を使ってparamsをアンラップ
  const { userId } = use(params)

  useEffect(() => {
    // モックデータから該当ユーザーのメッセージを取得
    const userMessages = mockMessages
      .filter(msg => msg.user_id === userId)
      .map(msg => ({
        ...msg,
        isOwn: false // 相手のメッセージ
      }))

    // 自分のメッセージも追加（モック）
    const ownMessages: Message[] = [
      {
        id: 'own1',
        text: 'こんにちは！',
        user_id: 'current_user',
        username: 'あなた',
        created_at: '2024-01-15T10:00:00Z',
        isOwn: true
      },
      {
        id: 'own2',
        text: 'お疲れ様です！',
        user_id: 'current_user',
        username: 'あなた',
        created_at: '2024-01-15T10:05:00Z',
        isOwn: true
      }
    ]

    const allMessages = [...userMessages, ...ownMessages]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    setMessages(allMessages)
  }, [userId])

  useEffect(() => {
    // メッセージが更新されたら最下部にスクロール
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)
    
    // 新しいメッセージを追加
    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      user_id: 'current_user',
      username: 'あなた',
      created_at: new Date().toISOString(),
      isOwn: true
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // 模擬的な送信遅延
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getAvatarLetter = (username: string) => {
    if (!username || username.length === 0) return 'U'
    return username.charAt(0).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex max-w-7xl mx-auto">
        {/* 左サイドバー */}
        <div className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
          <Sidebar />
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl lg:border-r border-gray-800 flex flex-col h-screen">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/messages" 
                  className="hover:bg-gray-800 p-2 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {getAvatarLetter(messages[0]?.username || 'U')}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold">
                      {messages[0]?.username || 'Unknown User'}
                    </h1>
                    <p className="text-sm text-gray-500">オンライン</p>
                  </div>
                </div>
              </div>
              <button className="hover:bg-gray-800 p-2 rounded-full transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
          
          {/* メッセージ一覧 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-2 max-w-xs lg:max-w-md ${message.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {!message.isOwn && (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getAvatarLetter(message.username)}
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.isOwn 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-800 text-white'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-gray-800 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* メッセージ入力 */}
          <div className="sticky bottom-0 bg-black/80 backdrop-blur-md border-t border-gray-800 p-4">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="メッセージを入力..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* 右サイドバー - デスクトップのみ */}
        <div className="hidden xl:block w-80 flex-shrink-0 h-screen sticky top-0 p-4">
          <div className="sticky top-4">
            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">メッセージについて</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                リアルタイムでメッセージのやり取りができます。Enterキーで送信、Shift+Enterで改行ができます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
