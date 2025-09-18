"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface UserProfile {
  id: string;
  display_name: string;
  setID: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  birth_date: string;
  join_date: string;
  icon_url?: string;
  following: number;
  follower: number;
}

function getPublicIconUrl(iconUrl?: string) {
  if (!iconUrl) return "";
  if (iconUrl.includes("cloudflarestorage.com")) {
    const filename = iconUrl.split("/").pop();
    if (!filename) return "";
    return `https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/${filename}`;
  }
  return iconUrl;
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]); // 投稿一覧用
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);

  useEffect(() => {
    // ログインユーザーID取得
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("usels")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!error && data) {
        setProfile({
          id: data.id,
          display_name: data.display_name || "ユーザー",
          username: data.username || "user",
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
          birth_date: data.birth_date || "",
          join_date: data.join_date || "",
          icon_url: data.icon_url || undefined,
          following: data.following || 0,
          follower: data.follower || 0,
          setID: data.setID || "user",
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    // フォロー状態取得
    if (!currentUserId || !userId || currentUserId === userId) return;
    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("followed_id", userId)
      .then(({ data }) => {
        setIsFollowing((data?.length ?? 0) > 0);
      });
  }, [currentUserId, userId]);

  // フォロー数とフォロワー数取得
  useEffect(() => {
    if (!userId) return;
    // フォロー数取得
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId)
      .then(({ count }) => {
        setFollowingCount(count ?? 0);
      });
    // フォロワー数取得
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("followed_id", userId)
      .then(({ count }) => {
        setFollowerCount(count ?? 0);
      });
  }, [userId, isFollowing]);

  // 投稿一覧取得
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("todos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setPosts(data);
      });
  }, [userId]);

  const handleFollow = async () => {
    if (!currentUserId || !userId) return;
    await supabase
      .from("follows")
      .insert([{ follower_id: currentUserId, followed_id: userId }]);
    setIsFollowing(true);
  };

  const handleUnfollow = async () => {
    if (!currentUserId || !userId) return;
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("followed_id", userId);
    setIsFollowing(false);
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (!profile)
    return <div className="text-white p-8">ユーザーが見つかりません</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex max-w-7xl mx-auto">
        {/* 左サイドバー */}
        <div className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
          <Sidebar />
        </div>
        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl lg:border-r border-gray-800">
          {/* ヘッダーにホームへのリンクを追加 */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-lg lg:text-xl font-bold">
                {profile.display_name}
              </h1>
            </div>
          </div>
          <div className="relative">
            <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative" />
            <div className="px-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end -mt-12 sm:-mt-16 space-y-4 sm:space-y-0">
                <div className="relative">
                  {profile.icon_url ? (
                    <Image
                      src={getPublicIconUrl(profile.icon_url)}
                      alt="icon"
                      width={128}
                      height={128}
                      className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-4 border-black object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-full border-4 border-black flex items-center justify-center text-white text-2xl sm:text-4xl font-bold">
                      {profile.display_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {currentUserId &&
                    currentUserId !== userId &&
                    (isFollowing ? (
                      <button
                        onClick={handleUnfollow}
                        className="border px-4 py-2 rounded-full font-semibold bg-gray-600 text-white transition-colors flex items-center space-x-2 text-sm sm:text-base"
                      >
                        フォロー中
                      </button>
                    ) : (
                      <button
                        onClick={handleFollow}
                        className="border px-4 py-2 rounded-full font-semibold bg-white text-black hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                      >
                        フォロー
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg sm:text-xl">
                    {profile.username}
                  </span>
                  <span className="text-gray-400 text-base sm:text-lg">
                    @{profile.setID}
                  </span>
                  {/* 例として最新投稿のcreated_atを表示（なければ空） */}
                  {posts.length > 0 && (
                    <>
                      <span className="text-gray-400 text-base sm:text-lg">
                        ・
                      </span>
                      <span className="text-gray-400 text-base sm:text-lg">
                        {posts[0].created_at
                          ? new Date(posts[0].created_at).toLocaleString(
                              "ja-JP",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : ""}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-white">{profile.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center space-x-1">
                    <a
                      href={profile.website}
                      className="text-blue-400 hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <span>{profile.birth_date}から登録</span>
                </div>
              </div>
              <div className="flex space-x-6 text-sm">
                <div className="flex space-x-1">
                  <span className="font-semibold">{followingCount}</span>
                  <span className="text-gray-400">フォロー中</span>
                </div>
                <div className="flex space-x-1">
                  <span className="font-semibold">{followerCount}</span>
                  <span className="text-gray-400">フォロワー</span>
                </div>
              </div>
            </div>
          </div>
          {/* 投稿一覧 */}
          <div className="divide-y divide-gray-800">
            {posts.map((post) => {
              const rawIconUrl = profile?.icon_url;
              const publicIconUrl = getPublicIconUrl(profile?.icon_url);
              return (
                <div
                  key={post.id}
                  className="p-4 hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex space-x-3">
                    {/* 投稿アイコン表示 */}
                    {publicIconUrl && publicIconUrl.startsWith("https://") ? (
                      <Image
                        src={publicIconUrl}
                        alt="icon"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {(profile?.username || "U").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold">
                          {profile?.display_name}
                        </span>
                        <span className="text-gray-400 text-sm">
                          @{profile?.username}
                        </span>
                        <span className="text-gray-400 text-sm">·</span>
                        <span className="text-gray-400 text-sm">
                          {post.created_at
                            ? new Date(post.created_at).toLocaleString("ja-JP")
                            : ""}
                        </span>
                      </div>
                      <p className="text-white mb-2 break-words">
                        {post.title}
                      </p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <button className="hover:text-blue-400 transition-colors">
                          返信 {post.replies ?? 0}
                        </button>
                        <button className="hover:text-red-400 transition-colors">
                          いいね {post.likes ?? 0}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
