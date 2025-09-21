"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import PostForm from "@/components/PostForm";
import Post from "@/components/Post";
import MobileNavigation from "@/components/MobileNavigation";
import MobileExtendedNavigation from "@/components/MobileExtendedNavigation";
import { supabase } from "@/utils/supabase/client";
import PWAInstaller from "@/components/PWAInstaller";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { useAuth } from "@/contexts/AuthContext";
// 🔧 共通型定義をインポート
import { PostType, ReplyType, StanpType } from "@/types/post";

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

// 🗑️ ローカルの型定義を削除（インポートした型を使用）
// type ReplyType = { ... } ← 削除
// type StanpType = { ... } ← 削除  
// type PostType = { ... } ← 削除

// R2のパブリック開発URL
const R2_PUBLIC_URL = "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [stampList, setStampList] = useState<string[]>([]);
  const [userMap, setUserMap] = useState<
    Record<
      string,
      {
        iconUrl?: string;
        displayName?: string;
        setID?: string;
        username?: string;
        isBunkatsu?: boolean;
      }
    >
  >({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // R2画像URL変換関数をメモ化
  const getPublicIconUrl = useCallback((iconUrl?: string) => {
    if (!iconUrl) return "";
    if (iconUrl.includes("cloudflarestorage.com")) {
      const filename = iconUrl.split("/").pop();
      if (!filename) return "";
      return `${R2_PUBLIC_URL}${filename}`;
    }
    return iconUrl;
  }, []);

  // 🚀 統一された最適化済み投稿取得関数
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. 投稿データを取得（最新50件に制限）
      const { data: todosData, error: todosError } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (todosError) {
        console.error("Error fetching todos:", todosError);
        setError("投稿の読み込みに失敗しました");
        return;
      }

      if (!todosData || todosData.length === 0) {
        setPosts([]);
        return;
      }

      // 2. ユーザーIDを抽出
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const userIds = Array.from(
        new Set(
          todosData
            .map((todo: any) => todo.user_id)
            .filter((id: string | null | undefined) =>
              !!id && id !== "null" && id !== "undefined" && uuidRegex.test(id)
            )
        )
      );

      // 3. 現在のユーザーIDを取得
      let userId = null;
      try {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id ?? null;
      } catch (error) {
        console.warn("Error getting user session:", error);
      }

      // 4. 投稿IDを抽出
      const postIds = todosData.map(todo => Number(todo.id));
      
      // 🚀 5. 全データを並列で一括取得
      const [
        usersResult, 
        likesResult, 
        bookmarksResult, 
        repliesResult, 
        stampsResult,
        stampListResult
      ] = await Promise.all([
        // ユーザー情報
        userIds.length > 0 
          ? supabase
              .from("usels")
              .select("user_id, icon_url, username, setID, isBunkatsu")
              .in("user_id", userIds)
          : Promise.resolve({ data: [], error: null }),
        
        // いいね情報（ログイン済みの場合のみ）
        userId && postIds.length > 0
          ? supabase
              .from("likes")
              .select("post_id, on")
              .eq("user_id", userId)
              .in("post_id", postIds)
          : Promise.resolve({ data: [], error: null }),
        
        // ブックマーク情報（ログイン済みの場合のみ）
        userId && postIds.length > 0
          ? supabase
              .from("bookmarks")
              .select("post_id, on")
              .eq("user_id", userId)
              .in("post_id", postIds)
          : Promise.resolve({ data: [], error: null }),
        
        // 🚀 リプライを一括取得
        postIds.length > 0
          ? supabase
              .from("replies")
              .select("id, post_id, user_id, text, created_at")
              .in("post_id", postIds)
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        
        // 🚀 スタンプを一括取得
        postIds.length > 0
          ? supabase
              .from("stamp")
              .select("id, post_id, user_id, stanp_url")
              .in("post_id", postIds)
          : Promise.resolve({ data: [], error: null }),
        
        // 🚀 スタンプリストを取得
        supabase
          .from("make_stamp")
          .select("make_stanp_url")
      ]);

      const { data: usersData } = usersResult;
      const { data: likesData } = likesResult;
      const { data: bookmarksData } = bookmarksResult;
      const { data: repliesData } = repliesResult;
      const { data: stampsData } = stampsResult;
      const { data: stampListData } = stampListResult;

      // 6. ユーザーマップを作成
      const userMapLocal: Record<string, any> = {};
      (usersData ?? []).forEach((user: any) => {
        userMapLocal[user.user_id] = {
          iconUrl: getPublicIconUrl(user.icon_url),
          displayName: user.username || "User",
          setID: user.setID || "",
          username: user.username || "",
          isBunkatsu: user.isBunkatsu ?? false,
        };
      });
      setUserMap(userMapLocal);

      // 7. リアクションマップを作成
      const likesMap = new Map();
      const bookmarksMap = new Map();
      
      (likesData ?? []).forEach((like: any) => {
        likesMap.set(like.post_id, like.on);
      });
      
      (bookmarksData ?? []).forEach((bookmark: any) => {
        bookmarksMap.set(bookmark.post_id, bookmark.on);
      });

      // 🚀 8. リプライマップを作成
      const repliesMap = new Map<number, ReplyType[]>();
      (repliesData ?? []).forEach((reply: any) => {
        const postId = reply.post_id;
        if (!repliesMap.has(postId)) {
          repliesMap.set(postId, []);
        }
        repliesMap.get(postId)!.push({
          ...reply,
          username: userMapLocal[reply.user_id]?.username || "User"
        });
      });

      // 🚀 9. スタンプマップを作成
      const stampsMap = new Map<number, StanpType[]>();
      (stampsData ?? []).forEach((stamp: any) => {
        const postId = Number(stamp.post_id);
        if (!stampsMap.has(postId)) {
          stampsMap.set(postId, []);
        }
        stampsMap.get(postId)!.push(stamp);
      });

      // 🚀 10. スタンプリストをグローバル状態に保存
      const stampListLocal = (stampListData ?? [])
        .map((row: any) => row.make_stanp_url)
        .filter(Boolean);
      setStampList(stampListLocal);

      // 11. 投稿データにすべての情報を統合
      const todosWithStatus = todosData.map((todo: any) => {
        const userInfo = userMapLocal[todo.user_id] || {};
        const postIdNum = Number(todo.id);
        
        return {
          ...todo,
          liked: likesMap.get(postIdNum) || false,
          bookmarked: bookmarksMap.get(postIdNum) || false,
          user_icon_url: userInfo.iconUrl,
          displayName: userInfo.displayName,
          setID: userInfo.setID,
          username: userInfo.username || "User",
          replies: todo.replies || 0, // 🔧 数値として保持
          // 🚀 リプライとスタンプを事前に含める
          replies_data: repliesMap.get(postIdNum) || [],
          stamps_data: stampsMap.get(postIdNum) || []
        };
      });

      setPosts(todosWithStatus);
    } catch (error) {
      console.error("fetchTodos: Unexpected error:", error);
      setError("データの読み込み中にエラーが発生しました");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [getPublicIconUrl]);

  // 投稿追加時の処理
  const handlePostAdded = useCallback(() => {
    setTimeout(() => {
      fetchTodos();
    }, 300);
  }, [fetchTodos]);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🔧 依存関係を修正した初期データ取得
  useEffect(() => {
    if (isClient && !authLoading) {
      fetchTodos();
    }
  }, [isClient, authLoading]); // fetchTodosを削除

  // リアルタイム購読
  useEffect(() => {
    if (!isClient) return;
    
    const channel = supabase
      .channel("todos-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "todos" },
        (payload) => {
          console.log("New post added:", payload);
          fetchTodos();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isClient]); // fetchTodosを削除

  // 1秒ごとの再レンダリングを最適化
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // 時間表示のみを更新
      setPosts(prev => [...prev]);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // いいね追加/削除を最適化
  const handleLike = async (postId: string) => {
    if (!user) return;

    const userId = user.id;
    const postIdNum = Number(postId);

    try {
      // 🚀 楽観的更新: UIを即座に更新
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const isCurrentlyLiked = post.liked;
            return {
              ...post,
              liked: !isCurrentlyLiked,
              likes: isCurrentlyLiked 
                ? Math.max(post.likes - 1, 0) 
                : post.likes + 1
            };
          }
          return post;
        })
      );

      // バックグラウンドでDB更新
      const { data: likeData, error: likeError } = await supabase
        .from("likes")
        .select("id, on")
        .eq("post_id", postIdNum)
        .eq("user_id", userId)
        .maybeSingle();

      if (likeError) {
        console.error("Error checking like status:", likeError);
        // エラー時は元に戻す
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                liked: !post.liked,
                likes: post.liked 
                  ? Math.max(post.likes - 1, 0) 
                  : post.likes + 1
              };
            }
            return post;
          })
        );
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
        await Promise.all([
          supabase
            .from("likes")
            .update({ on: false })
            .eq("post_id", postIdNum)
            .eq("user_id", userId),
          supabase
            .from("todos")
            .update({ likes: Math.max(currentLikes - 1, 0) })
            .eq("id", postIdNum)
        ]);
      } else {
        // いいね処理
        const isNewLike = !likeData;

        if (likeData) {
          // 再いいね
          await Promise.all([
            supabase
              .from("likes")
              .update({ on: true })
              .eq("post_id", postIdNum)
              .eq("user_id", userId),
            supabase
              .from("todos")
              .update({ likes: currentLikes + 1 })
              .eq("id", postIdNum)
          ]);
        } else {
          // 新規いいね
          await Promise.all([
            supabase.from("likes").insert({
              post_id: postIdNum,
              user_id: userId,
              created_at: new Date().toISOString(),
              on: true,
            }),
            supabase
              .from("todos")
              .update({ likes: currentLikes + 1 })
              .eq("id", postIdNum)
          ]);
        }

        // いいね通知を送信（新規いいねの場合のみ）
        if (isNewLike && postOwnerId && postOwnerId !== userId) {
          try {
            await fetch("/api/send-like-notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                postId: postIdNum,
                likerId: userId,
                postOwnerId: postOwnerId,
              }),
            });
          } catch (error) {
            console.error("Error sending like notification:", error);
          }
        }
      }

      // 🚀 全体リフレッシュは行わない（楽観的更新のみ）
    } catch (error) {
      console.error("Error in handleLike:", error);
      // エラー時は元に戻す
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              liked: !post.liked,
              likes: post.liked 
                ? Math.max(post.likes - 1, 0) 
                : post.likes + 1
            };
          }
          return post;
        })
      );
    }
  };

  // ブックマーク追加/解除を最適化
  const handleBookmark = async (postId: string) => {
    if (!user) {
      alert("ブックマークするにはログインが必要です");
      return;
    }

    const userId = user.id;
    const postIdNum = Number(postId);

    try {
      // 🚀 楽観的更新: UIを即座に更新
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              bookmarked: !post.bookmarked
            };
          }
          return post;
        })
      );

      // バックグラウンドでDB更新
      const { data: bookmarkData } = await supabase
        .from("bookmarks")
        .select("id, on")
        .eq("post_id", postIdNum)
        .eq("user_id", userId)
        .maybeSingle();

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
      
      // 🚀 全体リフレッシュは行わない（楽観的更新のみ）
    } catch (error) {
      console.error("Error in handleBookmark:", error);
      // エラー時は元に戻す
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              bookmarked: !post.bookmarked
            };
          }
          return post;
        })
      );
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => fetchTodos()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <PWAInstaller />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto flex h-screen">
          {/* デスクトップ: 左サイドバー */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            {isClient && <Sidebar />}
          </div>
          
          {/* メインコンテンツ */}
          <div className="flex-1 max-w-2xl mx-auto lg:border-r border-gray-800 relative z-10 overflow-y-auto pb-20 lg:pb-0">
            {/* ヘッダー */}
            <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-40">
              {/* モバイル: タイトルと認証ボタン */}
              <div className="lg:hidden flex items-center justify-between">
                <h1 className="text-xl font-bold">ホーム</h1>
                {isClient && (
                  <div className="flex items-center space-x-2">
                    {user ? (
                      <div className="flex items-center space-x-2">
                        {/* ユーザーアイコン */}
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.user_metadata?.displayName?.charAt(0) ||
                           user.user_metadata?.username?.charAt(0) ||
                           user.email?.charAt(0) ||
                           "U"}
                        </div>
                        <span className="text-sm text-gray-400">
                          {user.user_metadata?.displayName || 
                           user.user_metadata?.username || 
                           "ユーザー"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Link
                          href="/auth/login"
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                        >
                          ログイン
                        </Link>
                        <Link
                          href="/auth/signup"
                          className="px-3 py-1 text-sm border border-green-600 text-green-400 rounded-full hover:bg-green-900/30 transition-colors"
                        >
                          サインアップ
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* デスクトップ: タイトルのみ */}
              <h1 className="hidden lg:block text-xl font-bold">ホーム</h1>
              
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
            {isClient && <PostForm onPostAdded={handlePostAdded} r2PublicUrl={R2_PUBLIC_URL} />}
            
            {/* 投稿一覧表示 */}
            <div className="relative z-10">
              {posts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>まだ投稿がありません</p>
                </div>
              ) : (
                posts.map((todo) => {
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
                          replies: todo.replies_data || [], // 🔧 配列データを渡す
                          likes: todo.likes || 0,
                          bookmarked: todo.bookmarked || false,
                          image_url: todo.image_url || "",
                          user_icon_url: userMap[todo.user_id]?.iconUrl,
                          displayName: userMap[todo.user_id]?.displayName,
                          stamps: todo.stamps_data || []
                        }}
                        liked={todo.liked ?? false}
                        bookmarked={todo.bookmarked ?? false}
                        onLike={() => handleLike(todo.id)}
                        onBookmark={() => handleBookmark(todo.id)}
                        stampList={stampList}
                        currentUserId={user?.id || undefined} // 🔧 null を undefined に変換（または型定義を修正）
                        currentUserName={
                          user?.user_metadata?.displayName || 
                          user?.user_metadata?.username || 
                          userMap[user?.id || ""]?.username ||
                          "User"
                        }
                        onRefresh={fetchTodos}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* デスクトップ: 右サイドバー（ホームページでは非表示） */}
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
        </div>

        {/* モバイルナビゲーション */}
        {isClient && <MobileNavigation />}
        {isClient && <MobileExtendedNavigation />}
      </div>
    </>
  );
}
