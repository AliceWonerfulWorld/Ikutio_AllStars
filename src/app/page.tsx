'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import PostForm from '@/components/PostForm'
import Post from '@/components/Post'
import { mockPosts } from '@/data/mockData'
import { Post as PostType } from '@/types'

export default function Home() {
  const [posts, setPosts] = useState<PostType[]>(mockPosts)

  const handleSubmit = (text: string, tags: string[]) => {
    const newPost: PostType = {
      id: Date.now().toString(),
      text,
      tags,
      likes: 0,
      user_id: 'current_user',
      username: 'current_user',
      created_at: new Date().toISOString(),
      replies: 0,
      bookmarked: false
    }
    
    setPosts([newPost, ...posts])
  }

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ))
  }

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, bookmarked: !post.bookmarked }
        : post
    ))
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* サイドバー */}
      <Sidebar />
      
      {/* メインコンテンツ */}
      <div className="flex-1 max-w-2xl border-r border-gray-800">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
          <h1 className="text-xl font-bold">ホーム</h1>
        </div>

        {/* 投稿フォーム */}
        <PostForm onSubmit={handleSubmit} />

        {/* 投稿一覧 */}
        <div>
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onLike={handleLike}
              onBookmark={handleBookmark}
            />
          ))}
        </div>
      </div>

      {/* 右サイドバー */}
      <div className="w-80 p-4">
        <div className="sticky top-4 space-y-4">
          {/* 検索バー */}
          <div className="bg-gray-800 rounded-full p-3">
            <input
              type="text"
              placeholder="検索"
              className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
            />
          </div>

          {/* トレンド */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">いま話題</h2>
            <div className="space-y-3">
              <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                <div className="text-sm text-gray-500">プログラミング</div>
                <div className="font-semibold">#Next.js</div>
                <div className="text-sm text-gray-500">12.3K件のツイート</div>
              </div>
              <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                <div className="text-sm text-gray-500">テクノロジー</div>
                <div className="font-semibold">#Supabase</div>
                <div className="text-sm text-gray-500">8.7K件のツイート</div>
              </div>
              <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                <div className="text-sm text-gray-500">開発</div>
                <div className="font-semibold">#React</div>
                <div className="text-sm text-gray-500">25.1K件のツイート</div>
              </div>
            </div>
          </div>

          {/* おすすめユーザー */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">おすすめユーザー</h2>
            <div className="space-y-3">
              {['user1', 'user2', 'user3'].map((user) => (
                <div key={user} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{user}</div>
                      <div className="text-sm text-gray-500">@{user}</div>
                    </div>
                  </div>
                  <button className="bg-white text-black px-4 py-1 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
                    フォロー
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
