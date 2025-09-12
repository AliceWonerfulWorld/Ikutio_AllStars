'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Message from '@/components/Message'
import { mockMessages } from '@/data/mockMessageData'
import { Message as MessageType } from '@/types'

export default function MessagePage() {

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* サイドバー */}
      <Sidebar />
      
      {/* メインコンテンツ */}
      <div className="flex-1 max-w-2xl border-r border-gray-800">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:bg-gray-800 p-2 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold">メッセージ</h1>
          </div>
        </div>
        
            <div>
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
              />
            ))}
          </div>
　　　　　

       
      {/* 右サイドバー */}
      <div className="w-80 p-4">
        <div className="sticky top-4">
          <div className="bg-gray-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">メッセージについて</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              届いたメッセージは、このページでいつでも確認できます。内容を読んで、返信することができます。            </p>
          </div>
               </div>
    </div>
</div>
</div>
  )
}