"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import PostForm from "@/components/PostForm";
import Post from "@/components/Post";
import { supabase } from "@/utils/supabase/client";
import PWAInstaller from "@/components/PWAInstaller";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { useAuth } from "@/contexts/AuthContext";

// 砂時計アイコン（Lucide ReactのSVGをインラインで利用）
function HourglassIcon({ className = "w-5 h-5 text-yellow-400 mr-1" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3h12M6 21h12M8 3v2a6 6 0 006 6v2a6 6 0 01-6 6v2m8-18v2a6 6 0 01-6 6v2a6 6 0 006 6v2"
      />
    </svg>
  );
}

// 残り時間計算関数
function getRemainingTime(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const expires = created + 24 * 60 * 60 * 1000;
  const diff = expires - now;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

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
  image_url?: string;
  iconUrl?: string;
  displayName?: string;
  setID?: string;
  liked?: boolean;
};

// R2のパブリック開発URL
const R2_PUBLIC_URL = "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

// R2画像URL変換関数（profile画面と同じロジック）
function getPublicIconUrl(iconUrl?: string) {
  if (!iconUrl) return "";
  if (iconUrl.includes("cloudflarestorage.com")) {
    const filename = iconUrl.split("/").pop();
    if (!filename) return "";
    return `${R2_PUBLIC_URL}${filename}`;
  }
  return iconUrl;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  // usels全ユーザー情報を格納
  const [userMap, setUserMap] = useState<
    Record<
      string,
      {
        iconUrl?: string;
        displayName?: string;
        setID?: string;
        username?: string;
        isBunkatsu?: boolean; // 追加
      }
    >
  >({});

  // 初回マウント時にusels全件取得
  useEffect(() => {
    const fetchAllUsers = async () => {
      const { data, error } = await supabase
        .from("usels")
        .select("user_id, icon_url, username, setID, isBunkatsu"); // 追加
      if (error) {
        console.error("usels取得エラー", error);
        return;
      }
      const map: Record<
        string,
        {
          iconUrl?: string;
          displayName?: string;
          setID?: string;
          username?: string;
          isBunkatsu?: boolean;
        }
      > = {};
      (data ?? []).forEach((user: any) => {
        map[user.user_id] = {
          iconUrl: getPublicIconUrl(user.icon_url),
          displayName: user.username || "User",
          setID: user.setID || "",
          username: user.username || "",
          isBunkatsu: user.isBunkatsu ?? false, // 追加
        };
      });
      setUserMap(map);
    };
    fetchAllUsers();
  }, []);
  const [userId, setUserId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isValidUserId = (id: any) => typeof id === 'string' && id.length > 0 && id !== 'null' && id !== 'undefined';
  // Supabaseリアルタイム購読
  useEffect(() => {
    const channel = supabase
      .channel("todos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        (payload) => {
          fetchTodos();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ログインユーザーID取得
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const raw = userData?.user?.id ?? null;
      if (isValidUserId(raw)) setUserId(raw as string); else setUserId(null);
    };
    fetchUserId();
  }, []);

  // 認証リダイレクト後の ?error=server_error などをユーザーに可視化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    const desc = params.get('error_description');
    if (err) {
      let msg = `OAuth エラー (${err})`;
      if (desc) msg += `: ${decodeURIComponent(desc)}`;
      if (err === 'server_error') {
        msg += '\nTwitter プロバイダ設定 (Client ID/Secret または API Key/Secret) の不一致や X Portal の User authentication settings 未保存が原因の可能性があります。Supabase ダッシュボードで Twitter Provider のフィールド種別とキーを再確認し、X 側で Callback URL / Scope を保存して再試行してください。';
      }
      setAuthError(msg);
    }
  }, []);

  // 投稿取得 & ユーザー情報取得
  const fetchTodos = async () => {
    const { data: todosData, error: todosError } = await supabase
      .from("todos")
      .select("*");
    if (todosError) {
      console.error("Error fetching todos:", todosError);
      return;
    }
    // 投稿に紐づくuser_id一覧
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const userIds = Array.from(
      new Set(
        (todosData ?? [])
          .map((todo: any) => todo.user_id)
          .filter(
            (id: string | null | undefined) =>
              !!id && id !== "null" && id !== "undefined" && uuidRegex.test(id)
          )
      )
    );
    // uselsから該当ユーザー情報をまとめて取得
    let usersData: any[] = [];
    let usersError: any = null;
    if (userIds.length > 0) {
      const { data, error } = await supabase
        .from("usels")
        .select("user_id, icon_url, username, setID, isBunkatsu") // ← isBunkatsuを追加
        .in("user_id", userIds);
      usersData = data ?? [];
      usersError = error;
      if (usersError) {
        console.error("Error fetching users:", usersError);
      }
    }
    // user_id→iconUrl, displayName, setIDのMap作成
    const userMap: Record<
      string,
      {
        iconUrl?: string;
        displayName?: string;
        setID?: string;
        username?: string;
        isBunkatsu?: boolean; // ← 追加
      }
    > = {};
    (usersData ?? []).forEach((user: any) => {
      userMap[user.user_id] = {
        iconUrl: getPublicIconUrl(user.icon_url),
        displayName: user.username || "User",
        setID: user.setID || "",
        username: user.username || "",
        isBunkatsu: user.isBunkatsu ?? false, // ← 追加
      };
    });
    setUserMap(userMap);

    // ログインユーザーID取得
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;

    // 投稿一覧取得（userId が null の場合は likes / bookmarks クエリを送らない）
    const todosWithStatus = await Promise.all(
      (todosData ?? []).map(async (todo: any) => {
        if (!isValidUserId(userId)) {
          return { ...todo, liked: false, bookmarked: false };
        }
        try {
          const postIdNum = Number(todo.id);
          const [{ data: likeData }, { data: bookmarkData }] = await Promise.all([
            supabase
              .from("likes")
              .select("on")
              .eq("post_id", postIdNum)
              .eq("user_id", userId as string)
              .maybeSingle(),
            supabase
              .from("bookmarks")
              .select("on")
              .eq("post_id", postIdNum)
              .eq("user_id", userId as string)
              .maybeSingle(),
          ]);
          return {
            ...todo,
            liked: likeData?.on === true,
            bookmarked: bookmarkData?.on === true,
          };
        } catch (e) {
          console.warn("fetchTodos: like/bookmark 状態取得失敗", e);
          return { ...todo, liked: false, bookmarked: false };
        }
      })
    );
    setPosts(todosWithStatus);
  };

  // 1秒ごとに再レンダリングして残り時間を更新
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPosts((prev) => [...prev]); // 強制再レンダリング
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 投稿保存・取得直後の反映遅延対策: 1秒遅延してfetchTodos実行
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTodos();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // いいね追加/削除
  const handleLike = async (postId: string) => {
    if (!user) return;
    
    const userId = user.id;
    const postIdNum = Number(postId);

    // 既にいいね済みかチェック
    const { data: likeData, error: likeError } = await supabase
      .from("likes")
      .select("id, on")
      .eq("post_id", postIdNum)
      .eq("user_id", userId)
      .maybeSingle();

    if (likeError) {
      console.error('Error checking like status:', likeError);
      return;
    }

    // 現在のlikes取得
    const { data: todoData } = await supabase
      .from("todos")
      .select("likes, user_id")
      .eq("id", postIdNum)
      .single();
    const currentLikes = todoData?.likes ?? 0;
    const postOwnerId = todoData?.user_id;

    if (likeData?.on) {
      // いいね解除
      await supabase
        .from("likes")
        .update({ on: false })
        .eq("post_id", postIdNum)
        .eq("user_id", userId);
      await supabase
        .from("todos")
        .update({ likes: Math.max(currentLikes - 1, 0) })
        .eq("id", postIdNum);
    } else {
      // いいね処理
      const isNewLike = !likeData; // 新規いいねかどうかを判定
      
      if (likeData) {
        // 再いいね（通知は送信しない）
        await supabase
          .from("likes")
          .update({ on: true })
          .eq("post_id", postIdNum)
          .eq("user_id", userId);
        await supabase
          .from("todos")
          .update({ likes: currentLikes + 1 })
          .eq("id", postIdNum);
      } else {
        // 新規いいね（通知を送信）
        await supabase.from("likes").insert({
          post_id: postIdNum,
          user_id: userId,
          created_at: new Date().toISOString(),
          on: true,
        });
        await supabase
          .from("todos")
          .update({ likes: currentLikes + 1 })
          .eq("id", postIdNum);
      }

      // いいね通知を送信（新規いいねの場合のみ）
      if (isNewLike && postOwnerId && postOwnerId !== userId) {
        try {
          await fetch('/api/send-like-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              postId: postIdNum,
              likerId: userId,
              postOwnerId: postOwnerId,
            }),
          });
        } catch (error) {
          console.error('Error sending like notification:', error);
        }
      }
    }

    // 投稿データを再取得
    await fetchTodos();
  };

  // ブックマーク追加/解除
  const handleBookmark = async (postId: string) => {
    if (!user) {
      alert("ブックマークするにはログインが必要です");
      return;
    }
    const userId = user.id;
    const postIdNum = Number(postId);

    // 既にブックマーク済みかチェック
    const { data: bookmarkData } = await supabase
      .from("bookmarks")
      .select("id, on")
      .eq("post_id", postIdNum)
      .eq("user_id", userId)
      .single();

    if (bookmarkData?.on) {
      // ブックマーク解除
      await supabase
        .from("bookmarks")
        .update({ on: false })
        .eq("post_id", postIdNum)
        .eq("user_id", userId);
    } else {
      // ブックマーク（新規 or 再ブックマーク）
      if (bookmarkData) {
        await supabase
          .from("bookmarks")
          .update({ on: true })
          .eq("post_id", postIdNum)
          .eq("user_id", userId);
      } else {
        await supabase.from("bookmarks").insert({
          post_id: postIdNum,
          user_id: userId,
          created_at: new Date().toISOString(),
          on: true,
        });
      }
    }
    fetchTodos(); // 状態更新
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        // 基本的な投稿データを取得
        const { data: todosData, error: todosError } = await supabase
          .from("todos")
          .select("*")
          .order("created_at", { ascending: false });

        if (todosError) {
          throw todosError;
        }

        if (!todosData) {
          setPosts([]);
          return;
        }

        // 認証済みユーザーの場合のみ、いいね・ブックマーク状態を取得
        if (user) {
          const userId = user.id;

          const postsWithUserData = await Promise.all(
            todosData.map(async (todo) => {
              try {
                // いいね状態
                const { data: likeData } = await supabase
                  .from("likes")
                  .select("on")
                  .eq("post_id", Number(todo.id))
                  .eq("user_id", userId)
                  .maybeSingle();

                // ブックマーク状態
                const { data: bookmarkData } = await supabase
                  .from("bookmarks")
                  .select("on")
                  .eq("post_id", Number(todo.id))
                  .eq("user_id", userId)
                  .maybeSingle();

                return {
                  ...todo,
                  liked: likeData?.on === true,
                  bookmarked: bookmarkData?.on === true,
                };
              } catch (error) {
                console.warn(
                  `投稿 ${todo.id} のユーザーデータ取得エラー:`,
                  error
                );
                return {
                  ...todo,
                  liked: false,
                  bookmarked: false,
                };
              }
            })
          );

          setPosts(postsWithUserData);
        } else {
          // 未ログインの場合は、いいね・ブックマーク状態なしで表示
          const postsWithoutUserData = todosData.map((todo) => ({
            ...todo,
            liked: false,
            bookmarked: false,
          }));
          setPosts(postsWithoutUserData);
        }
      } catch (error) {
        console.error("投稿取得エラー:", error);
        setError("投稿の読み込みに失敗しました");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    // 認証状態が確定してから実行
    if (!authLoading) {
      fetchPosts();
    }
  }, [user, authLoading]);

  return (
    <>
      <ServiceWorkerRegistration />
      <PWAInstaller />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto flex h-screen">
          {/* サイドバー */}
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
          {/* メインコンテンツ */}
          <div className="flex-1 max-w-2xl mx-auto border-r border-gray-800 relative z-10 overflow-y-auto">
            {/* ヘッダー */}
            <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-40">
              <h1 className="text-xl font-bold">ホーム</h1>
              {authError && (
                <div className="mt-2 bg-red-900/40 border border-red-700 text-red-200 text-sm p-3 rounded">
                  <p className="font-semibold mb-1">サインインエラー</p>
                  <pre className="whitespace-pre-wrap break-all text-xs leading-relaxed">{authError}</pre>
                  <p className="mt-2">
                    手順: 1) Supabase {'>'} Auth {'>'} Providers {'>'} Twitter のフィールド種別とキー再保存 2) X Developer Portal の User authentication settings を再保存 (Callback / Scope) 3) 再ログイン。
                  </p>
                </div>
              )}
            </div>
            {/* 投稿フォーム */}
            <PostForm onPostAdded={fetchTodos} r2PublicUrl={R2_PUBLIC_URL} />
            {/* 投稿一覧表示 */}
            <div className="relative z-10">
              {posts.map((todo) => {
                const remaining = getRemainingTime(todo.created_at);
                const result = todo.title;
                const hours = Math.floor(
                  (new Date().getTime() - new Date(todo.created_at).getTime()) /
                    3600000
                );
                // isBunkatsu取得
                const isBunkatsu = userMap[todo.user_id]?.isBunkatsu;
                let temp = result;
                if (isBunkatsu) {
                  temp = result.slice(0, result.length - hours * 2);
                  if (result.length >= 24) {
                    temp = result.slice(0, result.length - hours * 3);
                  }
                }

                return (
                  <div key={todo.id} className="relative">
                    {/* 砂時計＋残り時間 */}
                    {remaining && (
                      <div className="absolute right-4 top-2 flex items-center bg-gray-900/80 rounded-full px-2 py-1 text-xs z-20 border border-yellow-400">
                        <HourglassIcon />
                        <span className="text-yellow-300 font-mono">
                          {remaining}
                        </span>
                      </div>
                    )}

                    <Post
                      post={{
                        id: todo.id,
                        user_id: todo.user_id || "",
                        username:
                          userMap[todo.user_id]?.username ||
                          todo.username ||
                          "User",
                        setID: userMap[todo.user_id]?.setID || "",
                        title: temp,
                        created_at: todo.created_at || "",
                        tags: todo.tags || [],
                        replies: todo.replies || 0,
                        likes: todo.likes || 0,
                        bookmarked: todo.bookmarked || false,
                        image_url: todo.image_url || "",
                        user_icon_url: userMap[todo.user_id]?.iconUrl,
                        displayName: userMap[todo.user_id]?.displayName,
                      }}
                      liked={todo.liked ?? false}
                      bookmarked={todo.bookmarked ?? false}
                      onLike={() => handleLike(todo.id)}
                      onBookmark={() => handleBookmark(todo.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {/* 右サイドバー */}
          <div className="w-80 flex-shrink-0 h-screen overflow-y-auto">
            <div className="p-4 space-y-4">
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
                    <div className="text-sm text-gray-500">
                      12.3K件のツイート
                    </div>
                  </div>
                  <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                    <div className="text-sm text-gray-500">テクノロジー</div>
                    <div className="font-semibold">#Supabase</div>
                    <div className="text-sm text-gray-500">
                      8.7K件のツイート
                    </div>
                  </div>
                  <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                    <div className="text-sm text-gray-500">開発</div>
                    <div className="font-semibold">#React</div>
                    <div className="text-sm text-gray-500">
                      25.1K件のツイート
                    </div>
                  </div>
                  <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                    <div className="text-sm text-gray-500">AI</div>
                    <div className="font-semibold">#ChatGPT</div>
                    <div className="text-sm text-gray-500">
                      18.9K件のツイート
                    </div>
                  </div>
                  <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                    <div className="text-sm text-gray-500">デザイン</div>
                    <div className="font-semibold">#Figma</div>
                    <div className="text-sm text-gray-500">
                      7.2K件のツイート
                    </div>
                  </div>
                </div>
              </div>

              {/* おすすめユーザー */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h2 className="text-xl font-bold mb-4">おすすめユーザー</h2>
                <div className="space-y-3">
                  {["user1", "user2", "user3"].map((user) => (
                    <div
                      key={user}
                      className="flex items-center justify-between"
                    >
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
              <div className="text-xs text-gray-500 space-y-1 pb-4">
                <div className="flex flex-wrap gap-2">
                  <span className="hover:underline cursor-pointer">
                    利用規約
                  </span>
                  <span className="hover:underline cursor-pointer">
                    プライバシーポリシー
                  </span>
                  <span className="hover:underline cursor-pointer">
                    クッキーポリシー
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="hover:underline cursor-pointer">
                    アクセシビリティ
                  </span>
                  <span className="hover:underline cursor-pointer">
                    広告情報
                  </span>
                  <span className="hover:underline cursor-pointer">その他</span>
                </div>
                <div className="text-gray-600 mt-2">© 2024 Ikutio AllStars</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
