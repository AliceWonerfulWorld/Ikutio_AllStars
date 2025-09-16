"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Post from "@/components/Post";
import { supabase } from "@/utils/supabase/client";
import { Post as PostType } from "@/types";

export default function BookmarksPage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);


  useEffect(() => {
    const fetchUserId = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData?.user?.id ?? null);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!userId) return;
      // ブックマーク済みのpost_id一覧取得
      const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", userId)
        .eq("on", true);

      const postIds = (bookmarks ?? []).map((b: any) => b.post_id);
      if (postIds.length === 0) {
        setPosts([]);
        return;
      }
      // 投稿情報取得
      const { data: todos } = await supabase
        .from("todos")
        .select("*")
        .in("id", postIds);

      // いいね・ブックマーク状態を取得して反映
      const postsWithStatus = await Promise.all(
        (todos ?? []).map(async (post: any) => {
          // いいね状態
          const { data: likeData } = await supabase
            .from("likes")
            .select("on")
            .eq("post_id", post.id)
            .eq("user_id", userId)
            .maybeSingle();

          // ブックマーク状態
          const { data: bookmarkData } = await supabase
            .from("bookmarks")
            .select("on")
            .eq("post_id", post.id)
            .eq("user_id", userId)
            .maybeSingle();

          return {
            ...post,
            liked: likeData?.on === true,
            bookmarked: bookmarkData?.on === true,
          };
        })
      );

      setPosts(postsWithStatus);
    };
    fetchBookmarks();
  }, [userId]);

  // いいね追加/解除
  const handleLike = async (postId: string) => {
    if (!userId) return;
    const postIdNum = Number(postId);

    // 既にいいね済みかチェック
    const { data: likeData } = await supabase
      .from("likes")
      .select("id, on")
      .eq("post_id", postIdNum)
      .eq("user_id", userId)
      .single();

    // 現在のlikes取得
    const { data: todoData } = await supabase
      .from("todos")
      .select("likes")
      .eq("id", postIdNum)
      .single();
    const currentLikes = todoData?.likes ?? 0;

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
      // いいね（新規 or 再いいね）
      if (likeData) {
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
    }
    // 状態更新
    const fetchBookmarks = async () => {
      if (!userId) return;
      // ブックマーク済みのpost_id一覧取得
      const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", userId)
        .eq("on", true);

      const postIds = (bookmarks ?? []).map((b: any) => b.post_id);
      if (postIds.length === 0) {
        setPosts([]);
        return;
      }
      // 投稿情報取得
      const { data: todos } = await supabase
        .from("todos")
        .select("*")
        .in("id", postIds);

      // いいね・ブックマーク状態を取得して反映
      const postsWithStatus = await Promise.all(
        (todos ?? []).map(async (post: any) => {
          // いいね状態
          const { data: likeData } = await supabase
            .from("likes")
            .select("on")
            .eq("post_id", post.id)
            .eq("user_id", userId)
            .maybeSingle();

          // ブックマーク状態
          const { data: bookmarkData } = await supabase
            .from("bookmarks")
            .select("on")
            .eq("post_id", post.id)
            .eq("user_id", userId)
            .maybeSingle();

          return {
            ...post,
            liked: likeData?.on === true,
            bookmarked: bookmarkData?.on === true,
          };
        })
      );

      setPosts(postsWithStatus);
    };
    fetchBookmarks();
  };

  // ブックマーク追加/解除
  const handleBookmark = async (postId: string) => {
    if (!userId) return;
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
    // 状態更新
    const fetchBookmarks = async () => {
      if (!userId) return;
      // ブックマーク済みのpost_id一覧取得
      const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", userId)
        .eq("on", true);

      const postIds = (bookmarks ?? []).map((b: any) => b.post_id);
      if (postIds.length === 0) {
        setPosts([]);
        return;
      }
      // 投稿情報取得
      const { data: todos } = await supabase
        .from("todos")
        .select("*")
        .in("id", postIds);

      // いいね・ブックマーク状態を取得して反映
      const postsWithStatus = await Promise.all(
        (todos ?? []).map(async (post: any) => {
          // いいね状態
          const { data: likeData } = await supabase
            .from("likes")
            .select("on")
            .eq("post_id", post.id)
            .eq("user_id", userId)
            .maybeSingle();

          // ブックマーク状態
          const { data: bookmarkData } = await supabase
            .from("bookmarks")
            .select("on")
            .eq("post_id", post.id)
            .eq("user_id", userId)
            .maybeSingle();

          return {
            ...post,
            liked: likeData?.on === true,
            bookmarked: bookmarkData?.on === true,
          };
        })
      );

      setPosts(postsWithStatus);
    };
    fetchBookmarks();

  };

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
                    ...post,
                    bookmarked: post.bookmarked ?? false,
                  }}
                  liked={post.liked === true}
                  bookmarked={post.bookmarked === true}
                  onLike={() => handleLike(post.id)}
                  onBookmark={() => handleBookmark(post.id)}
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">プログラミング関連</span>
                  <span className="text-white font-semibold">
                    {
                      posts.filter((post) =>
                        post.tags.some((tag) =>
                          [
                            "プログラミング",
                            "Next.js",
                            "Supabase",
                            "React",
                            "JavaScript",
                          ].includes(tag)
                        )
                      ).length
                    }
                    件
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">その他</span>
                  <span className="text-white font-semibold">
                    {
                      posts.filter(
                        (post) =>
                          !post.tags.some((tag) =>
                            [
                              "プログラミング",
                              "Next.js",
                              "Supabase",
                              "React",
                              "JavaScript",
                            ].includes(tag)
                          )
                      ).length
                    }
                    件
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
