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

  useEffect(() => {
    const fetchTodos = async () => {
      //supabase.from("todos").select("*");で取得
      const { data, error } = await supabase.from("todos").select("*");
      if (data) setTodos(data);
    };
    fetchTodos();
  }, []);

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
          <PostForm onSubmit={() => {}} />
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
            {/* ...その他のUI... */}
          </div>
        </div>
      </div>
    </div>
  );
}
