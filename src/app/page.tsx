"use client";
import { useState, useEffect } from "react";
// import { useSession } from "@supabase/auth-helpers-react"; // 削除
type PostType = {
  id: string; // ← string型に戻す
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
  liked?: boolean; // ← 追加
};
import Sidebar from "@/components/Sidebar";
import PostForm from "@/components/PostForm";
import Post from "@/components/Post";
import { supabase } from "@/utils/supabase/client";
import PWAInstaller from "@/components/PWAInstaller";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

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
  const [todos, setTodos] = useState<PostType[]>([]);
  const [userMap, setUserMap] = useState<
    Record<
      string,
      {
        iconUrl?: string; // ← これが必須
        displayName?: string;
        setID?: string;
        username?: string;
      }
    >
  >({});
  const [userId, setUserId] = useState<string | null>(null); // 追加

  useEffect(() => {
    // ログインユーザーID取得
    const fetchUserId = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData?.user?.id ?? null);
    };
    fetchUserId();
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
              !!id && id !== "null" && id !== "undefined" && uuidRegex.test(id) // UUIDのみ
          )
      )
    );
    // uselsから該当ユーザー情報をまとめて取得
    let usersData: any[] = [];
    let usersError: any = null;
    if (userIds.length > 0) {
      const { data, error } = await supabase
        .from("usels") // ← ここがusels参照
        .select("user_id, icon_url, username, setID")
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
      }
    > = {};
    (usersData ?? []).forEach((user: any) => {
      userMap[user.user_id] = {
        iconUrl: getPublicIconUrl(user.icon_url), // ← icon_urlカラムを参照
        displayName: user.username || "User",
        setID: user.setID || "",
        username: user.username || "",
      };
    });
    setUserMap(userMap);

    // ログインユーザーID取得
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;

    // 投稿一覧取得
    const todosWithStatus = await Promise.all(
      (todosData ?? []).map(async (todo: any) => {
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
      })
    );
    setTodos(todosWithStatus);
  };

  // いいね追加/削除
  const handleLike = async (postId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
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
      // いいね解除（on: falseに更新、likesを-1）
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
        // 既存レコードがon: falseならon: trueに変更
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
        // 既存レコードがない場合のみinsert
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
    fetchTodos(); // 状態更新
  };

  // ブックマーク追加/解除
  const handleBookmark = async (postId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
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
    fetchTodos();
  }, []);

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
            <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 relative z-40">
              <h1 className="text-xl font-bold">ホーム</h1>
            </div>
            {/* 投稿フォーム */}
            <PostForm onPostAdded={fetchTodos} r2PublicUrl={R2_PUBLIC_URL} />
            {/* 投稿一覧表示 */}
            <div className="relative z-10">
              {todos.map((todo) => (
                <Post
                  key={todo.id}
                  post={{
                    id: todo.id,
                    user_id: todo.user_id || "",
                    username:
                      userMap[todo.user_id]?.username ||
                      todo.username ||
                      "User",
                    setID: userMap[todo.user_id]?.setID || "",
                    title: todo.title,
                    created_at: todo.created_at || "",
                    tags: todo.tags || [],
                    replies: todo.replies || 0,
                    likes: todo.likes || 0,
                    bookmarked: todo.bookmarked || false,
                    image_url: todo.image_url || "", // ← 修正: imageUrl → image_url
                    iconUrl: userMap[todo.user_id]?.iconUrl,
                    displayName: userMap[todo.user_id]?.displayName,
                  }}
                  liked={todo.liked ?? false}
                  bookmarked={todo.bookmarked ?? false}
                  onLike={() => handleLike(todo.id)}
                  onBookmark={() => handleBookmark(todo.id)}
                />
              ))}
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
