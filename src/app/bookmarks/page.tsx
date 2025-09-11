'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Post from '@/components/Post'
import { mockPosts } from '@/data/mockData'
import { Post as PostType } from '@/types'

export default function BookmarksPage() {
  const [posts] = useState<PostType[]>(mockPosts.filter(post => post.bookmarked))

  const handleLike = (postId: string) => {
    // ブックマークページではいいね機能を無効化
    console.log('いいね機能はブックマークページでは無効です')
  }

  const handleBookmark = (postId: string) => {
    // ブックマークページではブックマーク機能を無効化
    console.log('ブックマーク機能はブックマークページでは無効です')
  }

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
            <h1 className="text-xl font-bold">ブックマーク</h1>
          </div>
        </div>

        {/* ブックマークされた投稿一覧 */}
        <div>
          {posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">��</div>
              <h2 className="text-xl font-semibold mb-2">まだブックマークがありません</h2>
              <p>気になる投稿をブックマークして、後で簡単に見つけられるようにしましょう。</p>
            </div>
          ) : (
            posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                onLike={handleLike}
                onBookmark={handleBookmark}
              />
            ))
          )}
        </div>
      </div>

      {/* 右サイドバー */}
      <div className="w-80 p-4">
        <div className="sticky top-4">
          <div className="bg-gray-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">ブックマークについて</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              ブックマークした投稿は、このページでいつでも確認できます。
              気になる投稿を保存して、後でじっくり読むことができます。
            </p>
          </div>
          
          {/* ブックマーク統計 */}
          <div className="bg-gray-800 rounded-2xl p-4 mt-4">
            <h3 className="text-lg font-semibold mb-3">ブックマーク統計</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">総ブックマーク数</span>
                <span className="text-white font-semibold">{posts.length}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">プログラミング関連</span>
                <span className="text-white font-semibold">
                  {posts.filter(post => post.tags.some(tag => 
                    ['プログラミング', 'Next.js', 'Supabase', 'React', 'JavaScript'].includes(tag)
                  )).length}件
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">その他</span>
                <span className="text-white font-semibold">
                  {posts.filter(post => !post.tags.some(tag => 
                    ['プログラミング', 'Next.js', 'Supabase', 'React', 'JavaScript'].includes(tag)
                  )).length}件
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}