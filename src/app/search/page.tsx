"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/utils/supabase/client";

type Trend = {
  tag: string;
  count: number;
  totalLikes: number;
};

type Todo = {
  id: string;
  title: string;
  tags: string[];
  likes: number;
  user_id: string;
  created_at: string;
};

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [recommended, setRecommended] = useState<Todo[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [userWords, setUserWords] = useState<string[]>([]);

  useEffect(() => {
    // ログインユーザーID取得
    const fetchUserId = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData?.user?.id ?? null);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    // 投稿データ取得
    const fetchTodos = async () => {
      const { data } = await supabase
        .from("todos")
        .select("id, title, tags, likes, user_id, created_at");
      setTodos(data ?? []);
    };
    fetchTodos();
  }, []);

  useEffect(() => {
    // タグごとに投稿数・いいね数を集計
    const tagMap: Record<string, { count: number; totalLikes: number }> = {};
    todos.forEach((todo) => {
      (todo.tags || []).forEach((tag) => {
        if (!tagMap[tag]) tagMap[tag] = { count: 0, totalLikes: 0 };
        tagMap[tag].count += 1;
        tagMap[tag].totalLikes += todo.likes || 0;
      });
    });
    const trendArr: Trend[] = Object.entries(tagMap)
      .map(([tag, v]) => ({ tag, ...v }))
      .sort((a, b) => b.totalLikes - a.totalLikes || b.count - a.count)
      .slice(0, 10);
    setTrends(trendArr);
  }, [todos]);

  useEffect(() => {
    // 検索クエリでフィルタ
    if (!searchQuery) {
      setFilteredTodos([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredTodos(
      todos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(q) ||
          (todo.tags || []).some((tag) => tag.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, todos]);

  useEffect(() => {
    // ユーザー自身の投稿からタグ・ワード抽出
    if (!userId) return;
    const myPosts = todos.filter((t) => t.user_id === userId);
    const tags = Array.from(new Set(myPosts.flatMap((t) => t.tags || [])));
    setUserTags(tags);
    // 発言ワード（タイトルをスペース区切りで分割し3文字以上の単語のみ）
    const words = Array.from(
      new Set(
        myPosts
          .flatMap((t) => t.title.split(/\s+/))
          .map((w) => w.trim())
          .filter((w) => w.length >= 3)
      )
    );
    setUserWords(words);
  }, [userId, todos]);

  useEffect(() => {
    // おすすめ: 自分のタグや発言ワードと合致する他人の投稿
    if (!userId) return;
    if (userTags.length === 0 && userWords.length === 0) {
      setRecommended([]);
      return;
    }
    setRecommended(
      todos.filter(
        (todo) =>
          todo.user_id !== userId &&
          ((todo.tags || []).some((tag) => userTags.includes(tag)) ||
            userWords.some((word) => todo.title.includes(word)))
      )
    );
  }, [userId, todos, userTags, userWords]);

  const tabs = [
    { id: "recommended", label: "おすすめ" },
    { id: "trends", label: "トレンド" },
    { id: "search", label: "検索結果" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex max-w-7xl mx-auto">
        {/* 左サイドバー */}
        <div className="w-64 flex-shrink-0 h-screen sticky top-0">
          <Sidebar />
        </div>
        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl border-r border-gray-800">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <h1 className="text-xl font-bold">話題を検索</h1>
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
                placeholder="Q 検索"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveTab("search");
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          {/* タブ */}
          <div className="flex border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-white border-b-2 border-blue-500"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* コンテンツエリア */}
          <div className="p-4">
            {activeTab === "recommended" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">あなたにおすすめ</h2>
                {recommended.length === 0 ? (
                  <div className="text-gray-400">おすすめ投稿がありません</div>
                ) : (
                  recommended.map((todo) => (
                    <div
                      key={todo.id}
                      className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors"
                    >
                      <div className="font-semibold">{todo.title}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(todo.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        いいね: {todo.likes}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "trends" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">
                  トレンド（タグ×いいね数順）
                </h2>
                {trends.length === 0 ? (
                  <div className="text-gray-400">
                    トレンドデータがありません
                  </div>
                ) : (
                  trends.map((trend) => (
                    <div
                      key={trend.tag}
                      className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-lg">
                          #{trend.tag}
                        </div>
                        <div className="text-sm text-gray-400">
                          投稿数: {trend.count} / 合計いいね: {trend.totalLikes}
                        </div>
                      </div>
                      <TrendingUp className="text-green-400" size={20} />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "search" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">検索結果</h2>
                {filteredTodos.length === 0 ? (
                  <div className="text-gray-400">該当する投稿がありません</div>
                ) : (
                  filteredTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors"
                    >
                      <div className="font-semibold">{todo.title}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(todo.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        いいね: {todo.likes}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        {/* 右サイドバー */}
        <div className="w-80 flex-shrink-0 h-screen sticky top-0 p-4">
          {/* ライブ放送 */}
          <div className="bg-gray-800 rounded-2xl p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">Xでライブ放送する</h2>
            <div className="space-y-4">
              <div className="border border-gray-700 rounded-lg p-3 hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🔴</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">後日談というか</div>
                    <div className="text-xs text-gray-400">+26</div>
                  </div>
                </div>
              </div>
              <div className="border border-gray-700 rounded-lg p-3 hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🔴</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      桐光@FANBOXさんがホストしています
                    </div>
                    <div className="text-xs text-gray-400">
                      16時まで塗る塗る
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 本日のニュース */}
          <div className="bg-gray-800 rounded-2xl p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">本日のニュース</h2>
            <div className="space-y-3">
              <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                <div className="text-sm font-semibold">
                  ポケモンSV、色違いコライドンとミライドンの限定配布がスタート
                </div>
              </div>
              <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                <div className="text-sm font-semibold">
                  夜勤事件、実写映画化!永江二朗監督が恐怖を拡大
                </div>
              </div>
              <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                <div className="text-sm font-semibold">
                  でんぢゃらすじーさん、24年の伝説に終止符か?ファンの複雑な想い
                </div>
              </div>
            </div>
          </div>

          {/* おすすめメッセージ */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">おすすめ メッセージ</h2>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">メッセージ機能は準備中です</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
