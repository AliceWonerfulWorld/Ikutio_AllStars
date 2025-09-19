"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, Wine, Users, Radio, ExternalLink, Clock } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MobileNavigation from "@/components/MobileNavigation";
import MobileExtendedNavigation from "@/components/MobileExtendedNavigation";

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

// ニュース記事の型
type NewsArticle = {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
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

  // ニュース関連の状態（初期値にモックデータを設定）
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([
    {
      title: "ポケモンSV、色違いコライドンとミライドンの限定配布がスタート",
      description: "人気ゲームソフト『ポケットモンスター スカーレット・バイオレット』で、色違いの伝説のポケモンが限定配布されるイベントが開始されました。",
      url: "#",
      publishedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      source: "ゲームニュース",
    },
    {
      title: "夜勤事件、実写映画化!永江二朗監督が恐怖を拡大",
      description: "人気ホラーゲーム『夜勤事件』の実写映画化が決定。永江二朗監督が手がける本作は、ゲームの恐怖を忠実に再現すると話題になっています。",
      url: "#",
      publishedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      source: "映画ニュース",
    },
    {
      title: "でんぢゃらすじーさん、24年の伝説に終止符か?ファンの複雑な想い",
      description: "長年愛され続けてきた『でんぢゃらすじーさん』シリーズの終了が発表され、ファンからは複雑な声が寄せられています。",
      url: "#",
      publishedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      source: "エンタメニュース",
    },
  ]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  // ニュース取得関数（キャッシュを無効化）
  const fetchNews = async (forceRefresh = false) => {
    setIsLoadingNews(true);
    setNewsError(null);
    
    try {
      // キャッシュを無効化するためのクエリパラメータを追加
      const url = forceRefresh ? '/api/news?refresh=true' : '/api/news';
      
      console.log('ニュース取得開始:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('ニュース取得成功:', data.articles?.length || 0, '件');
      
      if (data.articles && data.articles.length > 0) {
        setNewsArticles(data.articles);
        setNewsError(null); // エラーをクリア
      } else {
        // APIから記事が返されない場合はフォールバックデータを使用
        const fixedDate = new Date('2024-01-01T00:00:00Z');
        setNewsArticles([
          {
            title: "ポケモンSV、色違いコライドンとミライドンの限定配布がスタート",
            description: "人気ゲームソフト『ポケットモンスター スカーレット・バイオレット』で、色違いの伝説のポケモンが限定配布されるイベントが開始されました。",
            url: "#",
            publishedAt: fixedDate.toISOString(),
            source: "ゲームニュース",
          },
          {
            title: "夜勤事件、実写映画化!永江二朗監督が恐怖を拡大",
            description: "人気ホラーゲーム『夜勤事件』の実写映画化が決定。永江二朗監督が手がける本作は、ゲームの恐怖を忠実に再現すると話題になっています。",
            url: "#",
            publishedAt: fixedDate.toISOString(),
            source: "映画ニュース",
          },
          {
            title: "でんぢゃらすじーさん、24年の伝説に終止符か?ファンの複雑な想い",
            description: "長年愛され続けてきた『でんぢゃらすじーさん』シリーズの終了が発表され、ファンからは複雑な声が寄せられています。",
            url: "#",
            publishedAt: fixedDate.toISOString(),
            source: "エンタメニュース",
          },
        ]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('ニュース取得エラー:', errorMessage);
      setNewsError(`ニュースを読み込めませんでした: ${errorMessage}`);
      
      // フォールバック: モックデータを使用
      const fixedDate = new Date('2024-01-01T00:00:00Z');
      setNewsArticles([
        {
          title: "ポケモンSV、色違いコライドンとミライドンの限定配布がスタート",
          description: "人気ゲームソフト『ポケットモンスター スカーレット・バイオレット』で、色違いの伝説のポケモンが限定配布されるイベントが開始されました。",
          url: "#",
          publishedAt: fixedDate.toISOString(),
          source: "ゲームニュース",
        },
        {
          title: "夜勤事件、実写映画化!永江二朗監督が恐怖を拡大",
          description: "人気ホラーゲーム『夜勤事件』の実写映画化が決定。永江二朗監督が手がける本作は、ゲームの恐怖を忠実に再現すると話題になっています。",
          url: "#",
          publishedAt: fixedDate.toISOString(),
          source: "映画ニュース",
        },
        {
          title: "でんぢゃらすじーさん、24年の伝説に終止符か?ファンの複雑な想い",
          description: "長年愛され続けてきた『でんぢゃらすじーさん』シリーズの終了が発表され、ファンからは複雑な声が寄せられています。",
          url: "#",
          publishedAt: fixedDate.toISOString(),
          source: "エンタメニュース",
        },
      ]);
    } finally {
      setIsLoadingNews(false);
    }
  };

  // コンポーネントマウント時にニュースを取得
  useEffect(() => {
    fetchNews();
    
    // 30分ごとにニュースを更新
    const newsInterval = setInterval(fetchNews, 30 * 60 * 1000);
    
    return () => clearInterval(newsInterval);
  }, []);

  // 既存のuseEffectはそのまま維持
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectToTikuriBar = () => {
      try {
        ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080');
        
        const connectionTimeout = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.CONNECTING) {
            console.log('TikuriBar WebSocket接続タイムアウト');
            ws.close();
            setWsConnected(false);
          }
        }, 5000);
        
        ws.onopen = () => {
          console.log('TikuriBar WebSocket接続成功');
          clearTimeout(connectionTimeout);
          setWsConnected(true);
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
          
          if (event.code !== 1000 && event.code !== 1001) {
            reconnectTimeout = setTimeout(() => {
              console.log('TikuriBar WebSocket再接続を試行...');
              connectToTikuriBar();
            }, 5000);
          }
        };

        ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.warn('TikuriBar WebSocket接続エラー - サーバーが利用できない可能性があります');
          setWsConnected(false);
          
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              console.log('TikuriBar WebSocket再接続を試行...');
              connectToTikuriBar();
            }, 10000);
          }
        };

      } catch (error) {
        console.warn('TikuriBar WebSocket作成エラー:', error);
        setWsConnected(false);
        
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            console.log('TikuriBar WebSocket再接続を試行...');
            connectToTikuriBar();
          }, 15000);
        }
      }
    };

    connectToTikuriBar();

    const interval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'get_bars' }));
        } catch (error) {
          console.warn('TikuriBar 定期更新エラー:', error);
        }
      }
    }, 30000);

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

  // ニュース記事の時間フォーマット関数
  const formatNewsTime = (publishedAt: string) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now.getTime() - published.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else {
      return `${diffDays}日前`;
    }
  };

  // ニュース記事をクリックした時の処理
  const handleNewsClick = (url: string) => {
    if (url !== "#") {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // 更新ボタンのクリックハンドラー
  const handleRefreshNews = () => {
    console.log('更新ボタンがクリックされました');
    fetchNews(true); // 強制更新
  };

  const tabs = [
    { id: "recommended", label: "おすすめ" },
    { id: "trends", label: "トレンド" },
    { id: "search", label: "検索結果" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto flex h-screen">
        {/* デスクトップ: 左サイドバー */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0">
          <div className="max-w-2xl mx-auto lg:border-r border-gray-800 h-full overflow-y-auto pb-20 lg:pb-0">
            {/* ヘッダー */}
            <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-40">
              {/* モバイル: タイトルのみ */}
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
                  className={`px-3 lg:px-6 py-4 text-sm font-medium transition-colors ${
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
        
        {/* デスクトップ: 右サイドバー */}
        <div className="hidden xl:block w-80 flex-shrink-0 h-screen overflow-y-auto">
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">本日のニュース</h2>
                <button
                  onClick={handleRefreshNews}
                  disabled={isLoadingNews}
                  className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
                >
                  {isLoadingNews ? '更新中...' : '更新'}
                </button>
              </div>
              
              {isLoadingNews ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="animate-spin w-6 h-6 border-2 border-gray-600 border-t-white rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">ニュースを読み込み中...</p>
                </div>
              ) : newsError && newsArticles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-sm">{newsError}</p>
                  <button
                    onClick={handleRefreshNews}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    再試行
                  </button>
                </div>
              ) : newsArticles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2"></div>
                  <p className="text-sm">ニュースがありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newsArticles.slice(0, 5).map((article, index) => (
                    <div
                      key={index}
                      onClick={() => handleNewsClick(article.url)}
                      className="group hover:bg-gray-700 p-3 rounded-lg cursor-pointer transition-all duration-200 border border-gray-700 hover:border-gray-600"
                    >
                      <div className="flex items-start space-x-3">
                        {article.imageUrl && (
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-700 rounded-lg overflow-hidden">
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                            {article.title}
                          </div>
                          {article.description && (
                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {article.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex items-center space-x-1">
                              <Clock size={10} className="text-gray-500" />
                              <span className="text-xs text-gray-500">
                                {formatNewsTime(article.publishedAt)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">
                              {article.source}
                            </span>
                            {article.url !== "#" && (
                              <>
                                <span className="text-xs text-gray-500">•</span>
                                <ExternalLink size={10} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
        
        {/* デスクトップ: 右サイドバー */}
        <div className="hidden xl:block w-80 flex-shrink-0 h-screen overflow-y-auto">
          {/* 右サイドバーのコンテンツ */}
          <div className="p-4 space-y-6">
            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">トレンド</h2>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <p className="text-sm">トレンド情報は準備中です</p>
              </div>
            </div>
          </div>
        </div>

        {/* モバイルナビゲーション */}
        <MobileNavigation />
        <MobileExtendedNavigation />
      </div>
    </div>
  );
}
