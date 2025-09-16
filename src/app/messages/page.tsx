"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/utils/supabase/client";

type UserType = {
  user_id: string;
  username: string;
  icon_url?: string;
  setID?: string;
};

export default function MessagePage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // ログインユーザーID取得
    const fetchCurrentUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData?.user?.id ?? null);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // uselsテーブルから全ユーザー取得
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("usels")
        .select("user_id, username, icon_url, setID");
      if (!error && data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter((u) => u.user_id !== currentUserId)
    .filter((u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getAvatarLetter = (username: string) => {
    if (!username || username.length === 0) return "U";
    return username.charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto flex">
          {/* サイドバー */}
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
          {/* メインコンテンツ */}
          <div className="flex-1 max-w-2xl mx-auto border-r border-gray-800">
            {/* ヘッダー */}
            <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link
                    href="/"
                    className="hover:bg-gray-800 p-2 rounded-full transition-colors"
                  >
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
                    placeholder="ユーザー名で検索"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  />
                </div>
              </div>
            </div>
            {/* ユーザー一覧 */}
            <div className="divide-y divide-gray-800">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-xl font-semibold mb-2">
                    {searchQuery
                      ? "検索結果が見つかりません"
                      : "ユーザーがいません"}
                  </h2>
                  <p>
                    {searchQuery
                      ? "別のキーワードで検索してみてください。"
                      : "メッセージを送りたいユーザーがここに表示されます。"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="p-4 hover:bg-gray-900/50 transition-colors cursor-pointer"
                    onClick={() => {
                      window.location.href = `/messages/${user.user_id}`;
                    }}
                  >
                    <div className="flex space-x-3">
                      {/* アバター */}
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold">
                        {getAvatarLetter(user.username)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white hover:underline">
                          {user.username}
                        </span>
                        {user.setID && (
                          <span className="ml-2 text-gray-400 text-xs">
                            @{user.setID}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* 右サイドバー */}
          <div className="w-80 flex-shrink-0 p-4">
            <div className="sticky top-4 space-y-4">
              <div className="bg-gray-800 rounded-2xl p-4">
                <h2 className="text-xl font-bold mb-4">メッセージについて</h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  ユーザーを選択してメッセージを送信できます。ユーザー名で検索も可能です。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
