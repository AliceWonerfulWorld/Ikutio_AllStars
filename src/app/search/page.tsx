"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, Wine, Users, Radio } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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

// TikuriBarルーム情報の型
type BarRoom = {
  id: string;
  title: string;
  userCount: number;
  createdAt: number;
  hostName: string;
};

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [recommended, setRecommended] = useState<Todo[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [userWords, setUserWords] = useState<string[]>([]);
  
  // TikuriBar関連の状態
  const [tikuriBars, setTikuriBars] = useState<BarRoom[]>([]);
  const [isLoadingBars, setIsLoadingBars] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket接続とTikuriBarルーム情報の取得
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectToTikuriBar = () => {
      try {
        // WebSocket接続を試行（タイムアウト付き）
        ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080');
        
        // 接続タイムアウトを設定
        const connectionTimeout = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.CONNECTING) {
            console.log('TikuriBar WebSocket接続タイムアウト');
            ws.close();
            setWsConnected(false);
          }
        }, 5000); // 5秒でタイムアウト
        
        ws.onopen = () => {
          console.log('TikuriBar WebSocket接続成功');
          clearTimeout(connectionTimeout);
          setWsConnected(true);
          // ルーム一覧を取得
          if (ws && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'get_bars' }));
            } catch (error) {
              console.warn('TikuriBar ルーム一覧取得エラー:', error);
            }
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'bars_list') {
              setTikuriBars(data.bars || []);
            }
          } catch (error) {
            console.warn('TikuriBar メッセージ解析エラー:', error);
          }
        };

        ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('TikuriBar WebSocket接続が切断されました:', event.code, event.reason);
          setWsConnected(false);
          
          // 自動再接続を試行（サーバーエラーでない場合）
          if (event.code !== 1000 && event.code !== 1001) {
            reconnectTimeout = setTimeout(() => {
              console.log('TikuriBar WebSocket再接続を試行...');
              connectToTikuriBar();
            }, 5000); // 5秒後に再接続
          }
        };

        ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.warn('TikuriBar WebSocket接続エラー - サーバーが利用できない可能性があります');
          setWsConnected(false);
          
          // エラー時は再接続を試行
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              console.log('TikuriBar WebSocket再接続を試行...');
              connectToTikuriBar();
            }, 10000); // 10秒後に再接続
          }
        };

      } catch (error) {
        console.warn('TikuriBar WebSocket作成エラー:', error);
        setWsConnected(false);
        
        // 作成エラー時も再接続を試行
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            console.log('TikuriBar WebSocket再接続を試行...');
            connectToTikuriBar();
          }, 15000); // 15秒後に再接続
        }
      }
    };

    // 接続を開始
    connectToTikuriBar();

    // 定期的にルーム一覧を更新（接続されている場合のみ）
    const interval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'get_bars' }));
        } catch (error) {
          console.warn('TikuriBar 定期更新エラー:', error);
        }
      }
    }, 30000); // 30秒ごとに更新

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
      clearInterval(interval);
    };
  }, []);

  // 既存のuseEffectはそのまま維持
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData?.user?.id ?? null);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchTodos = async () => {
      const { data } = await supabase
        .from("todos")
        .select("id, title, tags, likes, user_id, created_at");
      setTodos(data ?? []);
    };
    fetchTodos();
  }, []);

  useEffect(() => {
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
    if (!userId) return;
    const myPosts = todos.filter((t) => t.user_id === userId);
    const tags = Array.from(new Set(myPosts.flatMap((t) => t.tags || [])));
    setUserTags(tags);
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

  // TikuriBarルーム参加処理
  const handleJoinTikuriBar = (barId: string) => {
    if (!user) {
      alert("TikuriBarに参加するにはログインが必要です");
      return;
    }
    // TikuriBarページに遷移
    router.push(`/tikuribar?join=${barId}`);
  };

  // 時間フォーマット関数
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    }
    return `${minutes}分`;
  };

  const tabs = [
    { id: "recommended", label: "おすすめ" },
    { id: "trends", label: "トレンド" },
    { id: "search", label: "検索結果" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto flex h-screen">
        {/* 左サイドバー */}
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0">
          <div className="max-w-2xl mx-auto border-r border-gray-800 h-full overflow-y-auto">
            {/* ヘッダー */}
            <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-40">
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
        </div>
        
        {/* 右サイドバー */}
        <div className="w-80 flex-shrink-0 h-screen overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* TikuriBar ライブルーム */}
            <div className="bg-gradient-to-br from-amber-900/20 via-black/60 to-orange-900/20 backdrop-blur-xl rounded-2xl p-4 border border-amber-500/30 shadow-2xl shadow-amber-500/10">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-r from-amber-500/80 to-orange-500/80 rounded-lg mr-3 shadow-lg">
                  <Wine size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                  TikuriBAR ライブルーム
                </h2>
                <div className="ml-3 flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-400">
                    {wsConnected ? '接続中' : '未接続'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {!wsConnected ? (
                  <div className="text-center py-8 text-gray-400">
                    <Wine size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">TikuriBARサーバーに接続できません</p>
                    <p className="text-xs mt-1">サーバーが起動していない可能性があります</p>
                    <button
                      onClick={() => router.push('/tikuribar')}
                      className="mt-3 bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500/80 hover:to-orange-500/80 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm"
                    >
                      TikuriBARページへ
                    </button>
                  </div>
                ) : tikuriBars.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Wine size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">現在営業中のBARはありません</p>
                    <p className="text-xs mt-1">新しいBARを作成してみましょう！</p>
                  </div>
                ) : (
                  tikuriBars.map((bar) => (
                    <div
                      key={bar.id}
                      onClick={() => handleJoinTikuriBar(bar.id)}
                      className="group bg-gradient-to-br from-gray-800/40 via-black/60 to-gray-700/40 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-lg hover:shadow-amber-500/20 relative overflow-hidden"
                    >
                      {/* ホバー時の光るエフェクト */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="flex items-center space-x-3 relative z-10">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500/80 to-orange-500/80 rounded-full flex items-center justify-center shadow-lg">
                            <Radio size={20} className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm group-hover:text-amber-100 transition-colors duration-300 truncate">
                            {bar.title}
                          </div>
                          <div className="flex items-center space-x-3 mt-1">
                            <div className="flex items-center space-x-1">
                              <Users size={12} className="text-amber-400" />
                              <span className="text-xs text-amber-300">{bar.userCount}人</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-red-400">LIVE</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDuration(Date.now() - bar.createdAt)}前から営業中
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* TikuriBARに移動するボタン */}
                <button
                  onClick={() => router.push('/tikuribar')}
                  className="w-full bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500/80 hover:to-orange-500/80 text-white py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25 flex items-center justify-center space-x-2 backdrop-blur-sm border border-amber-400/50 group"
                >
                  <Wine size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-semibold">TikuriBARへ</span>
                </button>
              </div>
            </div>

            {/* 本日のニュース */}
            <div className="bg-gray-800 rounded-2xl p-4">
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
    </div>
  );
}
