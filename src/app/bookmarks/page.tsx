"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Post from "@/components/Post";
import { supabase } from "@/utils/supabase/client";
import { PostType } from "@/types/post";

export default function BookmarksPage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData?.user?.id ?? null);
    };
    fetchUserId();
  }, []);

  // R2画像URL変換関数
  const getPublicIconUrl = (iconUrl?: string) => {
    if (!iconUrl) return "";
    if (iconUrl.includes("cloudflarestorage.com")) {
      const filename = iconUrl.split("/").pop();
      if (!filename) return "";
      return `https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/${filename}`;
    }
    return iconUrl;
  };

  useEffect(() => {
    const fetchBookmarksWithUserInfo = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // 1. ブックマーク済みのpost_id一覧取得
        const { data: bookmarks } = await supabase
          .from("bookmarks")
          .select("post_id")
          .eq("user_id", userId)
          .eq("on", true);

        const postIds = (bookmarks ?? []).map((b: any) => b.post_id);
        if (postIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // 2. 投稿情報取得
        const { data: todos } = await supabase
          .from("todos")
          .select("*")
          .in("id", postIds)
          .order("created_at", { ascending: false });

        if (!todos || todos.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // 3. 投稿者のユーザーIDを抽出
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const userIds = Array.from(
          new Set(
            todos
              .map((todo: any) => todo.user_id)
              .filter((id: string | null | undefined) =>
                !!id && id !== "null" && id !== "undefined" && uuidRegex.test(id)
              )
          )
        );

        console.log("📋 投稿データ:", todos);
        console.log("👥 ユーザーID一覧:", userIds);

        // 🔧 ホーム画面と同じ方法でユーザー情報を取得
        const [usersResult, likesResult, bookmarksResult] = await Promise.all([
          // 🔧 ホーム画面と同じカラムを取得
          userIds.length > 0
            ? supabase
                .from("usels")
                .select("user_id, icon_url, username, setID, isBunkatsu") // 🔧 display_nameを削除、isBunkatsuを追加
                .in("user_id", userIds)
            : Promise.resolve({ data: [], error: null }),
          
          // いいね状態を一括取得
          supabase
            .from("likes")
            .select("post_id, on")
            .eq("user_id", userId)
            .in("post_id", postIds),
          
          // ブックマーク状態を一括取得
          supabase
            .from("bookmarks")
            .select("post_id, on")
            .eq("user_id", userId)
            .in("post_id", postIds)
        ]);

        const { data: usersData, error: usersError } = usersResult;
        const { data: likesData } = likesResult;
        const { data: bookmarksData } = bookmarksResult;

        console.log("👤 取得したユーザーデータ:", usersData);
        console.log("❌ ユーザーデータ取得エラー:", usersError);

        // 🔧 ホーム画面と同じ方法でユーザーマップを作成
        const userMap: Record<string, any> = {};
        (usersData ?? []).forEach((user: any) => {
          console.log(`🔍 ユーザーマップ作成: ${user.user_id} -> username: ${user.username}, setID: ${user.setID}`);
          userMap[user.user_id] = {
            iconUrl: getPublicIconUrl(user.icon_url),
            displayName: user.username || "User", // 🔧 ホーム画面と同じ
            setID: user.setID || "", // 🔧 ホーム画面と同じ
            username: user.username || "", // 🔧 ホーム画面と同じ
            isBunkatsu: user.isBunkatsu ?? false,
          };
        });

        console.log("🗺️ 完成したユーザーマップ:", userMap);

        // 6. リアクションマップを作成
        const likesMap = new Map();
        const bookmarksMap = new Map();
        
        (likesData ?? []).forEach((like: any) => {
          likesMap.set(like.post_id, like.on);
        });
        
        (bookmarksData ?? []).forEach((bookmark: any) => {
          bookmarksMap.set(bookmark.post_id, bookmark.on);
        });

        // 7. 投稿データにユーザー情報を統合
        const postsWithUserInfo = todos.map((post: any) => {
          const userInfo = userMap[post.user_id] || {};
          const postIdNum = Number(post.id);
          
          console.log(`📝 投稿 ${post.id} の統合:`, {
            post_user_id: post.user_id,
            userInfo: userInfo,
            finalUsername: userInfo.username || post.username || "Unknown User",
            finalSetID: userInfo.setID || post.username || "unknown"
          });
          
          return {
            ...post,
            liked: likesMap.get(postIdNum) || false,
            bookmarked: bookmarksMap.get(postIdNum) || false,
            // 🚀 ユーザー情報を正しく設定
            user_icon_url: userInfo.iconUrl || "",
            displayName: userInfo.displayName || post.username || "Unknown User",
            setID: userInfo.setID || post.username || "unknown",
            username: userInfo.username || post.username || "Unknown User",
          };
        });

        console.log("✅ 最終的な投稿データ:", postsWithUserInfo);
        setPosts(postsWithUserInfo);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarksWithUserInfo();
  }, [userId]);

  // いいね追加/解除（楽観的更新対応）
  const handleLike = async (postId: string) => {
    if (!userId) return;

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

      const postIdNum = Number(postId);

      // バックグラウンドでDB更新
      const { data: likeData } = await supabase
        .from("likes")
        .select("id, on")
        .eq("post_id", postIdNum)
        .eq("user_id", userId)
        .maybeSingle();

      const { data: todoData } = await supabase
        .from("todos")
        .select("likes")
        .eq("id", postIdNum)
        .single();
      const currentLikes = todoData?.likes ?? 0;

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
        if (likeData) {
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
      }
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

  // ブックマーク追加/解除（楽観的更新対応）
  const handleBookmark = async (postId: string) => {
    if (!userId) return;

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

      const postIdNum = Number(postId);

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
        // ブックマーク追加
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
          <p>ブックマークを読み込み中...</p>
        </div>
      </div>
    );
  }

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
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="hover:bg-gray-800 p-2 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-bold">ブックマーク</h1>
            </div>
          </div>

          {/* ブックマークされた投稿一覧 */}
          <div>
            {posts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-6xl mb-4">🔖</div>
                <h2 className="text-xl font-semibold mb-2">
                  まだブックマークがありません
                </h2>
                <p>
                  気になる投稿をブックマークして、後で簡単に見つけられるようにしましょう。
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <Post
                  key={post.id}
                  post={{
                    id: post.id,
                    user_id: post.user_id,
                    username: post.username || "Unknown User", // 🔧 統合されたユーザー名
                    title: post.title,
                    created_at: post.created_at,
                    tags: post.tags || [],
                    replies: [],
                    likes: post.likes,
                    bookmarked: post.bookmarked ?? false,
                    image_url: post.image_url,
                    user_icon_url: post.user_icon_url || "", // 🔧 統合されたアイコンURL
                    displayName: post.displayName || post.username || "Unknown User",
                    setID: post.setID || post.username || "unknown", // 🔧 統合されたsetID
                    stamps: []
                  }}
                  liked={post.liked === true}
                  bookmarked={post.bookmarked === true}
                  onLike={() => handleLike(post.id)}
                  onBookmark={() => handleBookmark(post.id)}
                  stampList={[]}
                  currentUserId={userId || undefined}
                  currentUserName={post.username || "User"}
                />
              ))
            )}
          </div>
        </div>

        {/* 右サイドバー */}
        <div className="w-80 flex-shrink-0 h-screen sticky top-0 p-4">
          <div className="sticky top-4">
            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">ブックマークについて</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                ブックマークした投稿は、このページでいつでも確認できます。
                気になる投稿を保存して、後でじっくり読むことができます。
              </p>
            </div>

            {/* ブックマーク統計 */}
            <div className="bg-gray-800 rounded-2xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3">ブックマーク統計</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">総ブックマーク数</span>
                  <span className="text-white font-semibold">
                    {posts.length}件
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
