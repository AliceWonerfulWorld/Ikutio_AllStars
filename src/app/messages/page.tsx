'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Message from '@/components/Message'
import { mockMessages } from '@/data/mockMessageData'

export default function MessagePage() {
  const [messages] = useState(mockMessages)

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
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:bg-gray-800 p-2 rounded-full transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-bold">メッセージ</h1>
            </div>
          </div>
          
          {/* メッセージ一覧 */}
          <div className="divide-y divide-gray-800">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold mb-2">メッセージがありません</h2>
                <p>新しいメッセージが届いたら、ここに表示されます。</p>
              </div>
            ) : (
              messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
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