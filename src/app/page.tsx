"use client";
import { useState, useEffect } from "react";
type PostType = {
  id: string;
  user_id: string;
  username: string;
  title: string;
  created_at: string;
  tags: string[];
  replies: number;
  likes: number;
  bookmarked: boolean;
};
import Sidebar from "@/components/Sidebar";
import PostForm from "@/components/PostForm";
import Post from "@/components/Post";
import { supabase } from "@/utils/supabase/client";

export default function Home() {
  //anyはTSのどんな方でも使える配列
  const [todos, setTodos] = useState<any[]>([]);

  const fetchTodos = async () => {
    //supabase.from("todos").select("*");で取得
    const { data, error } = await supabase.from("todos").select("*");
    if (data) setTodos(data);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // R2のパブリック開発URL
  const R2_PUBLIC_URL = "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto flex">
        {/* サイドバー */}
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        {/* メインコンテンツ */}
        <div className="flex-1 max-w-2xl mx-auto border-r border-gray-800">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
            <h1 className="text-xl font-bold">ホーム</h1>
          </div>
          {/* 投稿フォーム */}
          <PostForm onPostAdded={fetchTodos} r2PublicUrl={R2_PUBLIC_URL} />
          {/* todos一覧（Postコンポーネントで表示） */}
          <div>
            {todos.map((todo) => (
              <Post
                key={todo.id}
                post={{
                  id: todo.id,
                  // ||は空だったら右側を入れる処理
                  user_id: todo.user_id || "",
                  username: todo.username || "User",
                  title: todo.title,
                  created_at: todo.created_at || "",
                  tags: todo.tags || [],
                  replies: todo.replies || 0,
                  likes: todo.likes || 0,
                  bookmarked: todo.bookmarked || false,
                  imageUrl: todo.image_url || "", // 画像URLを渡す
                }}
                onLike={() => {}}
                onBookmark={() => {}}
              />
            ))}
          </div>
        </div>
        {/* 右サイドバー */}
        <div className="w-80 flex-shrink-0 p-4">
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
                <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                  <div className="text-sm text-gray-500">AI</div>
                  <div className="font-semibold">#ChatGPT</div>
                  <div className="text-sm text-gray-500">18.9K件のツイート</div>
                </div>
                <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                  <div className="text-sm text-gray-500">デザイン</div>
                  <div className="font-semibold">#Figma</div>
                  <div className="text-sm text-gray-500">7.2K件のツイート</div>
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

            {/* トレンド情報 */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <h3 className="text-lg font-semibold mb-3">今日のトレンド</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">プログラミング</span>
                  <span className="text-white font-semibold">+15%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">AI・機械学習</span>
                  <span className="text-white font-semibold">+23%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Web開発</span>
                  <span className="text-white font-semibold">+8%</span>
                </div>
              </div>
            </div>

            {/* フッター情報 */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex flex-wrap gap-2">
                <span className="hover:underline cursor-pointer">利用規約</span>
                <span className="hover:underline cursor-pointer">プライバシーポリシー</span>
                <span className="hover:underline cursor-pointer">クッキーポリシー</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="hover:underline cursor-pointer">アクセシビリティ</span>
                <span className="hover:underline cursor-pointer">広告情報</span>
                <span className="hover:underline cursor-pointer">その他</span>
              </div>
              <div className="text-gray-600 mt-2">
                © 2024 Ikutio AllStars
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
