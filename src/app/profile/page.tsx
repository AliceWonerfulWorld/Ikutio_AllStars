"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Edit3,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/utils/supabase/client";

// 型定義
interface FormData {
  setID: string;
  username: string;
  displayName: string;
  email: string;
  bio: string;
  location: string;
  site: string;
  birthDate: string;
  follow: number;
  follower: number;
  iconUrl?: string; // 追加
}

const R2_PUBLIC_URL = "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

function ProfilePageContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    setID: "",
    username: "",
    displayName: "",
    email: "",
    bio: "",
    location: "",
    site: "",
    birthDate: "",
    follow: 0,
    follower: 0,
    iconUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      if (user) {
        const { data: userData, error } = await supabase
          .from("usels")
          .select(
            "setID, username, introduction, place, site, user_id, birth_date, follow, icon_url"
          )
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("usels取得エラー:", error);
        }

        setFormData((prev) => ({
          ...prev,
          setID: userData?.setID || "",
          username: userData?.username || "",
          displayName: userData?.username || "",
          email: user.email || "",
          bio: userData?.introduction || "",
          location: userData?.place || "",
          site: userData?.site || "",
          birthDate: userData?.birth_date || "",
          follow: userData?.follow || 0,
          follower: 0,
          iconUrl: userData?.icon_url || "",
        }));
      }
    });
  }, []);

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      alert("ユーザーIDが取得できませんでした");
      return;
    }
    const updateData = {
      setID: formData.setID || "",
      username: formData.displayName || "",
      introduction: formData.bio || "",
      place: formData.location || "",
      site: formData.site || "",
      birth_date: formData.birthDate ? formData.birthDate : null,
      follow: Number(formData.follow) || 0,
    };
    const { error } = await supabase
      .from("usels")
      .update(updateData)
      .eq("user_id", userId);
    if (error) {
      alert("プロフィールの更新に失敗しました: " + error.message);
    } else {
      alert("プロフィールが更新されました！");
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // 画像アップロード処理
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルのみアップロードできます");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("画像サイズは5MB以下にしてください");
      return;
    }
    setUploading(true);
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      alert("ユーザーIDが取得できませんでした");
      setUploading(false);
      return;
    }
    let fileExt = file.name.split(".").pop();
    if (!fileExt) fileExt = "png";
    const fileName = `icon_${userId}_${Date.now()}.${fileExt}`;

    // ファイルをbase64化
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      // APIへPOST
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, fileName }),
      });
      if (!res.ok) {
        alert("アイコンアップロード失敗");
        setUploading(false);
        return;
      }
      const { imageUrl } = await res.json();
      // Supabaseに保存
      await supabase
        .from("usels")
        .update({ icon_url: imageUrl })
        .eq("user_id", userId);

      setFormData((prev) => ({
        ...prev,
        iconUrl: imageUrl,
      }));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const mockPosts = [
    {
      id: 1,
      content: "今日はNext.jsの勉強をしました！とても楽しいです。",
      timestamp: "2時間前",
      likes: 12,
      replies: 3,
      tags: ["Next.js", "プログラミング"],
    },
    {
      id: 2,
      content: "新しいプロジェクトを始めました。今度はSupabaseを使ってみます。",
      timestamp: "1日前",
      likes: 8,
      replies: 1,
      tags: ["Supabase", "開発"],
    },
  ];

  function getPublicIconUrl(iconUrl?: string) {
    if (!iconUrl) return "";
    // cloudflarestorage.com の場合 r2.dev に変換
    if (iconUrl.includes("cloudflarestorage.com")) {
      // 例: https://da1ba209d61b3c9fb6834468fb0bb4f4.r2.cloudflarestorage.com/24sns/icon_xxx.png
      // → https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/icon_xxx.png
      const filename = iconUrl.split("/").pop();
      if (!filename) return "";
      return `https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/${filename}`;
    }
    return iconUrl;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex max-w-7xl mx-auto">
        {/* 左サイドバー */}
        <div className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
          <Sidebar />
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl lg:border-r border-gray-800">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-lg lg:text-xl font-bold">
                  {formData.displayName}
                </h1>
                <p className="text-sm text-gray-400">
                  {formData.follow}件の投稿
                </p>
              </div>
            </div>
          </div>

          {/* プロフィールヘッダー */}
          <div className="relative">
            {/* カバー画像 */}
            <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative">
              <button className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors">
                <Camera size={20} />
              </button>
            </div>

            {/* プロフィール画像と編集ボタン */}
            <div className="px-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end -mt-12 sm:-mt-16 space-y-4 sm:space-y-0">
                <div className="relative">
                  {/* 画像表示 */}
                  {formData.iconUrl &&
                  getPublicIconUrl(formData.iconUrl).startsWith("https://") ? (
                    <img
                      src={getPublicIconUrl(formData.iconUrl)}
                      alt="icon"
                      className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-4 border-black object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-full border-4 border-black flex items-center justify-center text-white text-2xl sm:text-4xl font-bold">
                      {formData.displayName.charAt(0)}
                    </div>
                  )}
                  {/* 画像アップロードボタン */}
                  <label className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors cursor-pointer">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleIconUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-white text-black px-3 sm:px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                      >
                        <Save size={16} />
                        <span className="hidden sm:inline">保存</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="border border-gray-600 text-white px-3 sm:px-4 py-2 rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                      >
                        <X size={16} />
                        <span className="hidden sm:inline">キャンセル</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="border border-gray-600 text-white px-3 sm:px-4 py-2 rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                    >
                      <Edit3 size={16} />
                      <span className="hidden sm:inline">
                        プロフィールを編集
                      </span>
                      <span className="sm:hidden">編集</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* プロフィール情報 */}
          <div className="px-4 pb-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ユーザー名
                  </label>
                  <input
                    type="text"
                    value={formData.setID}
                    onChange={(e) => handleInputChange("setID", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    表示名
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) =>
                      handleInputChange("displayName", e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    自己紹介
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    場所
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ウェブサイト
                  </label>
                  <input
                    type="url"
                    value={formData.site}
                    onChange={(e) => handleInputChange("site", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    生年月日
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      handleInputChange("birthDate", e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {formData.displayName}
                  </h2>
                  <p className="text-gray-400">@{formData.setID}</p>
                </div>

                <p className="text-white">{formData.bio}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  {formData.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin size={16} />
                      <span>{formData.location}</span>
                    </div>
                  )}
                  {formData.site && (
                    <div className="flex items-center space-x-1">
                      <LinkIcon size={16} />
                      <a
                        href={formData.site}
                        className="text-blue-400 hover:underline"
                      >
                        {formData.site}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>{formData.birthDate}から登録</span>
                  </div>
                </div>

                <div className="flex space-x-6 text-sm">
                  <div className="flex space-x-1">
                    <span className="font-semibold">{formData.follow}</span>
                    <span className="text-gray-400">フォロー中</span>
                  </div>
                  <div className="flex space-x-1">
                    <span className="font-semibold">{formData.follower}</span>
                    <span className="text-gray-400">フォロワー</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* タブ */}
          <div className="flex border-b border-gray-800 overflow-x-auto">
            <button className="px-4 sm:px-6 py-4 text-sm font-medium text-white border-b-2 border-blue-500 whitespace-nowrap">
              投稿
            </button>
            <button className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-500 hover:text-white whitespace-nowrap">
              返信
            </button>
            <button className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-500 hover:text-white whitespace-nowrap">
              メディア
            </button>
            <button className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-500 hover:text-white whitespace-nowrap">
              いいね
            </button>
          </div>

          {/* 投稿一覧 */}
          <div className="divide-y divide-gray-800">
            {mockPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex space-x-3">
                  {/* 投稿アイコン表示 */}
                  {formData.iconUrl &&
                  getPublicIconUrl(formData.iconUrl).startsWith("https://") ? (
                    <img
                      src={getPublicIconUrl(formData.iconUrl)}
                      alt="icon"
                      className="w-10 h-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {formData.displayName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold">
                        {formData.displayName}
                      </span>
                      <span className="text-gray-400 text-sm">
                        @{formData.setID}
                      </span>
                      <span className="text-gray-400 text-sm">·</span>
                      <span className="text-gray-400 text-sm">
                        {post.timestamp}
                      </span>
                    </div>
                    <p className="text-white mb-2 break-words">
                      {post.content}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {post.tags.map((tag, index) => (
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
                        返信 {post.replies}
                      </button>
                      <button className="hover:text-red-400 transition-colors">
                        いいね {post.likes}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右サイドバー - デスクトップのみ */}
        <div className="hidden xl:block w-80 flex-shrink-0 h-screen sticky top-0 p-4">
          <div className="sticky top-4">
            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">おすすめユーザー</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      D
                    </div>
                    <div>
                      <div className="font-semibold">developer</div>
                      <div className="text-sm text-gray-400">@developer</div>
                    </div>
                  </div>
                  <button className="bg-white text-black px-4 py-1 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
                    フォロー
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
