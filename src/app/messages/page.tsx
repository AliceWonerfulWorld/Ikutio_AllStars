"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import MobileExtendedNavigation from "@/components/MobileExtendedNavigation";
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
      if (!error && data) {
        // 重複を除去（user_idでユニークにする）
        const uniqueUsers = data.reduce((acc: UserType[], current) => {
          const existingUser = acc.find(user => user.user_id === current.user_id);
          if (!existingUser) {
            acc.push(current);
          }
          return acc;
        }, []);
        setUsers(uniqueUsers);
      }
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto flex h-screen">
        {/* デスクトップ: 左サイドバー */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar />
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl lg:border-r border-gray-800 flex flex-col bg-black overflow-y-auto pb-20 lg:pb-0">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-bold">メッセージ</h1>
            </div>
          </div>

          {/* 検索バー */}
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="ユーザーを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* ユーザー一覧 */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-black">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">
                  {searchQuery
                    ? "別のキーワードで検索してみてください。"
                    : "メッセージを送りたいユーザーがここに表示されます。"}
                </p>
              </div>
            ) : (
              filteredUsers.map((user, index) => (
                <div
                  key={`${user.user_id}-${index}`}
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
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white truncate">
                          {user.username}
                        </h3>
                        {user.setID && (
                          <span className="text-gray-400 text-sm truncate">
                            @{user.setID}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate">
                        メッセージを送信
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* デスクトップ: 右サイドバー - 大きなデスクトップのみ */}
        <div className="hidden xl:block w-80 flex-shrink-0 h-screen overflow-y-auto p-4">
          <div className="sticky top-4">
            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">メッセージ機能</h2>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">メッセージ機能は準備中です</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* モバイルナビゲーション */}
      <MobileNavigation />
      <MobileExtendedNavigation />
    </div>
  );
}
