"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { Image, Smile, Calendar, MapPin, BarChart3, X, Clock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PostFormProps {
  onPostAdded?: () => void;
  onOptimisticPost?: (newPost: any) => void;
  onOptimisticUpdate?: (tempId: string, realPost: any) => void; // 🚀 楽観的更新の置き換え用
  r2PublicUrl?: string;
}

export default function PostForm({ 
  onPostAdded, 
  onOptimisticPost, 
  onOptimisticUpdate, 
  r2PublicUrl 
}: PostFormProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [canPost, setCanPost] = useState<boolean>(true);
  const [postError, setPostError] = useState<string>("");
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [showBanModal, setShowBanModal] = useState<boolean>(false);
  
  // ユーザープロフィール情報
  const [userProfile, setUserProfile] = useState<{
    icon_url?: string;
    username?: string;
    introduction?: string;
  } | null>(null);

  // R2のパブリック開発URL
  const R2_PUBLIC_URL = r2PublicUrl || "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

  // R2画像URL変換関数
  function getPublicIconUrl(iconUrl?: string) {
    if (!iconUrl) return "";
    if (iconUrl.includes("cloudflarestorage.com")) {
      const filename = iconUrl.split("/").pop();
      if (!filename) return "";
      return `${R2_PUBLIC_URL}${filename}`;
    }
    return iconUrl;
  }

  useEffect(() => {
    // ログインユーザーのUID取得とプロフィール情報取得
    const fetchUserProfile = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('PostForm: 認証エラー:', authError);
          return;
        }

        const uid = authData?.user?.id ?? null;
        setUserId(uid);
        
        if (!uid) return;

        // ユーザーデータを取得
        const { data: userRow, error: userError } = await supabase
          .from("usels")
          .select("icon_url, username, introduction, has_posted")
          .eq("user_id", uid)
          .maybeSingle();

        if (userError) {
          console.error('PostForm: ユーザーデータ取得エラー:', userError);
          return;
        }

        if (userRow) {
          setUserProfile({
            icon_url: userRow.icon_url,
            username: userRow.username,
            introduction: userRow.introduction,
          });

          // 🔧 正しい投稿制限ロジック
          if (userRow.has_posted === false) {
            // 初回投稿者は投稿可能
            setCanPost(true);
            setPostError("");
          } else {
            // 2回目以降：24時間以内に投稿していない場合はBAN
            const { data: lastPost, error: lastPostError } = await supabase
              .from("todos")
              .select("created_at")
              .eq("user_id", uid)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (lastPostError) {
              console.error('PostForm: 最終投稿取得エラー:', lastPostError);
              return;
            }

            if (!lastPost) {
              // 投稿履歴がない場合は投稿可能
              setCanPost(true);
              setPostError("");
              return;
            }
            
            const last = new Date(lastPost.created_at);
            const now = new Date();
            const diffH = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
            
            // 🚀 正しいロジック：24時間以内なら投稿可能、24時間経過したらBAN
            if (diffH <= 24) {
              console.log(`✅ 投稿可能: 前回から${diffH.toFixed(1)}時間経過`);
              setCanPost(true);
              setPostError("");
            } else {
              console.log(`🚨 BAN状態: 前回から${diffH.toFixed(1)}時間経過 (24時間超過)`);
              // 🚨 24時間経過したらBAN
              setCanPost(false);
              setPostError(
                "前回投稿から24時間以上経過したため、アカウントが制限されました。"
              );
              
              // 🔧 BANの詳細情報
              const banStartTime = new Date(last.getTime() + 24 * 60 * 60 * 1000);
              const banDuration = now.getTime() - banStartTime.getTime();
              const banHours = Math.floor(banDuration / (1000 * 60 * 60));
              const banDays = Math.floor(banHours / 24);
              
              if (banDays > 0) {
                setRemainingTime(`${banDays}日${banHours % 24}時間前からBAN中`);
              } else {
                setRemainingTime(`${banHours}時間前からBAN中`);
              }
            }
          }
        } else {
          // 新規ユーザーは投稿可能
          setCanPost(true);
          setPostError("");
          setUserProfile({
            icon_url: undefined,
            username: user?.user_metadata?.username || user?.email?.split('@')[0],
            introduction: undefined,
          });
        }
      } catch (error) {
        console.error('PostForm: プロフィール情報取得で予期しないエラー:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // 残り時間のカウントダウン
  useEffect(() => {
    if (!canPost && remainingTime) {
      const timer = setInterval(() => {
        supabase.auth.getUser().then(async ({ data }) => {
          const uid = data?.user?.id ?? null;
          if (!uid) return;
          
          const { data: lastPost } = await supabase
            .from("todos")
            .select("created_at")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (lastPost) {
            const last = new Date(lastPost.created_at);
            const now = new Date();
            const timeUntilNext = (last.getTime() + 24 * 60 * 60 * 1000) - now.getTime();
            
            if (timeUntilNext <= 0) {
              setCanPost(true);
              setPostError("");
              setRemainingTime("");
              setShowBanModal(false);
            } else {
              const hours = Math.floor(timeUntilNext / (1000 * 60 * 60));
              const minutes = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
              setRemainingTime(`${hours}時間${minutes}分`);
            }
          }
        });
      }, 60000); // 1分ごとに更新

      return () => clearInterval(timer);
    }
  }, [canPost, remainingTime]);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const uniqueFileName = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}.jpg`;
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = async () => {
        const img = new window.Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 400;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas
            .toDataURL("image/jpeg", 0.7)
            .split(",")[1];
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: compressedBase64,
              fileName: uniqueFileName,
            }),
          });
          resolve(r2PublicUrl + uniqueFileName);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false); // 🚀 送信状態管理

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // 🔧 重複送信防止
    
    // 🚀 投稿前に再度BAN状態をチェック（既存のロジック）
    if (!userId) {
      setPostError("ユーザー情報が取得できません");
      return;
    }

    // 🚀 一時的IDを事前に生成（スコープを広げる）
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      setIsSubmitting(true); // 🚀 送信開始

      // 最新の投稿状態を再確認
      const { data: userRow, error: userError } = await supabase
        .from("usels")
        .select("has_posted")
        .eq("user_id", userId)
        .maybeSingle();

      if (userError) {
        console.error('投稿前ユーザーチェックエラー:', userError);
        setPostError("ユーザー情報の確認に失敗しました");
        return;
      }

      // 2回目以降の投稿の場合、24時間ルールを厳格にチェック
      if (userRow?.has_posted) {
        const { data: lastPost, error: lastPostError } = await supabase
          .from("todos")
          .select("created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (lastPostError) {
          console.error('最終投稿チェックエラー:', lastPostError);
          setPostError("投稿履歴の確認に失敗しました");
          return;
        }

        if (lastPost) {
          const last = new Date(lastPost.created_at);
          const now = new Date();
          const diffH = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
          
          // 🚨 24時間経過している場合は投稿を拒否
          if (diffH > 24) {
            setCanPost(false);
            setPostError("前回投稿から24時間以上経過したため、アカウントが制限されました。");
            setShowBanModal(true);
            return; // 🔥 ここで処理を完全に停止
          }
        }
      }

      // BAN状態の場合は投稿を拒否
      if (!canPost) {
        setShowBanModal(true);
        return; // 🔥 ここで処理を完全に停止
      }
      
      if (!text.trim()) {
        setPostError("投稿内容を入力してください");
        return;
      }

      // 🚀 現在の値を保存（フォームリセット前に）
      const currentText = text;
      const currentTags = [...tags];
      const currentImageFile = imageFile;

      // 🚀 楽観的更新：UIを即座に更新
      const tempPost = {
        id: tempId,
        user_id: userId,
        username: userProfile?.username || "User",
        title: currentText,
        created_at: new Date().toISOString(),
        tags: currentTags,
        replies: 0, // 数値として設定
        likes: 0,
        bookmarked: false,
        image_url: currentImageFile ? "uploading..." : null,
        user_icon_url: userProfile?.icon_url,
        displayName: userProfile?.username,
        setID: userProfile?.username || "user",
        liked: false,
        // 🚀 楽観的更新用の追加データ
        replies_data: [],
        stamps_data: [],
        isOptimistic: true // 楽観的更新フラグ
      };

      // 🚀 UIを即座に更新
      if (onOptimisticPost) {
        onOptimisticPost(tempPost);
      }

      // 🚀 フォームを即座にリセット
      setText("");
      setTags([]);
      setImageFile(null);
      setPostError("");

      // 🔧 バックグラウンドで実際の投稿処理（ローディングなし）
      let imageUrl = null;
      if (currentImageFile) {
        try {
          imageUrl = await handleImageUpload(currentImageFile);
        } catch (error) {
          console.error("画像アップロードエラー:", error);
          // 画像アップロード失敗時は楽観的更新を修正
          if (onOptimisticUpdate) {
            onOptimisticUpdate(tempId, { ...tempPost, image_url: null });
          }
        }
      }

      const newPost = {
        title: currentText,
        tags: currentTags,
        created_at: new Date().toISOString(),
        image_url: imageUrl,
        user_id: userId,
      };

      const { data: insertedData, error } = await supabase
        .from("todos")
        .insert([newPost])
        .select() // 🚀 挿入されたデータを取得
        .single();
      
      if (error) {
        console.error("投稿エラー:", error);
        // 🚨 エラーの場合は楽観的更新を削除
        if (onOptimisticUpdate) {
          onOptimisticUpdate(tempId, null); // null = 削除
        }
        setPostError("投稿に失敗しました: " + error.message);
        return;
      }

      // 🎉 投稿成功 - 楽観的更新を実際のデータで置き換え
      if (onOptimisticUpdate && insertedData) {
        const realPost = {
          ...tempPost,
          id: insertedData.id.toString(), // 実際のID
          image_url: imageUrl,
          isOptimistic: false
        };
        onOptimisticUpdate(tempId, realPost);
      }

      // 🚀 全体再取得は行わない！

      // 初回投稿の場合、has_postedをtrueに設定
      if (!userProfile?.username) {
        await supabase
          .from("usels")
          .update({ has_posted: true })
          .eq("user_id", userId);
      }

    } catch (error) {
      console.error("投稿処理で予期しないエラー:", error);
      setPostError("投稿処理中にエラーが発生しました");
      // �� エラー時は楽観的更新を削除（tempIdがスコープ内で利用可能）
      if (onOptimisticUpdate) {
        onOptimisticUpdate(tempId, null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractTags = (text: string) => {
    const tagMatches = text.match(/#([^\s#]+)/g);
    return tagMatches ? tagMatches.map((tag) => tag.substring(1)) : [];
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setTags(extractTags(value));
  };

  // ユーザーアイコンのレンダリング関数
  const renderUserIcon = () => {
    if (userProfile?.icon_url) {
      const iconUrl = getPublicIconUrl(userProfile.icon_url);
      
      return (
        <div className="relative">
          <img
            src={iconUrl}
            alt={userProfile.username || "ユーザー"}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              // 画像読み込みに失敗した場合はデフォルトアイコンを表示
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          {/* フォールバックアイコン */}
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold absolute top-0 left-0" style={{ display: 'none' }}>
            {userProfile?.username?.charAt(0)?.toUpperCase() || 
             user?.email?.charAt(0)?.toUpperCase() || 
             'U'}
          </div>
        </div>
      );
    }

    // アイコンがない場合のデフォルト表示
    return (
      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold">
        {userProfile?.username?.charAt(0)?.toUpperCase() || 
         user?.email?.charAt(0)?.toUpperCase() || 
         'U'}
      </div>
    );
  };

  // BANモーダルコンポーネント
  const BanModal = () => {
    if (!showBanModal) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-gradient-to-br from-gray-900 via-black to-red-900/20 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30 shadow-2xl shadow-red-500/20 max-w-md w-full relative">
          {/* 閉じるボタン */}
          <button
            onClick={() => setShowBanModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* アイコン */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full border border-red-500/30">
              <span className="text-red-400 text-3xl font-bold">🚫</span>
            </div>
          </div>

          {/* タイトル */}
          <h3 className="text-2xl font-bold text-white text-center mb-4">
            アカウント制限中
          </h3>

          {/* メッセージ */}
          <div className="text-center mb-8">
            <p className="text-gray-300 text-lg mb-4">
              24時間以上投稿していないため、<br />
              アカウントが制限されました。
            </p>
            
            {remainingTime && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock size={20} className="text-red-400" />
                  <span className="text-red-400 font-semibold">BAN開始</span>
                </div>
                <div className="text-xl font-bold text-red-300">
                  {remainingTime}
                </div>
              </div>
            )}

            <p className="text-gray-400 text-sm">
              24時間以内に投稿しなかった場合、<br />
              アカウントが制限されます。
            </p>
          </div>

          {/* ボタン */}
          <div className="flex space-x-4">
            <button
              onClick={() => setShowBanModal(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <span className="font-semibold">閉じる</span>
            </button>
            <button
              onClick={() => {
                setShowBanModal(false);
                // ここでヘルプページやサポートに誘導することも可能
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center space-x-2"
            >
              <span className="font-semibold">ヘルプ</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="border-b border-gray-800 p-4">
        {!canPost && postError && (
          <div className="text-red-400 mb-2 text-sm">{postError}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-3">
            {/* ユーザーアイコン */}
            {renderUserIcon()}

            <div className="flex-1">
              <div className="relative w-full min-h-[120px]">
                <div
                  className="pointer-events-none w-full text-xl min-h-[120px] absolute top-0 left-0 z-0 px-3 py-2"
                  style={{ whiteSpace: "pre-wrap" }}
                  dangerouslySetInnerHTML={{
                    __html: text.replace(
                      /#([\wぁ-んァ-ン一-龠]+)/g,
                      '<span style="color:#3b82f6">#$1</span>'
                    ),
                  }}
                />
                <textarea
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="今何してる？"
                  className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-xl min-h-[120px] relative z-10 px-3 py-2"
                  rows={3}
                  maxLength={280}
                  style={{ background: "transparent" }}
                />
              </div>

              {/* タグプレビュー */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                {/* モバイル: アイコンを小さく、レスポンシブ対応 */}
                <div className="flex items-center space-x-2 lg:space-x-4 text-blue-400">
                  <button
                    type="button"
                    className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                    aria-label="画像を追加"
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                  >
                    <Image size={18} className="lg:w-5 lg:h-5" />
                  </button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setImageFile(file);
                    }}
                  />
                  {/* モバイルでは一部のアイコンを非表示 */}
                  <button
                    type="button"
                    className="hidden sm:block hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                    aria-label="投票を追加"
                  >
                    <BarChart3 size={18} className="lg:w-5 lg:h-5" />
                  </button>
                  <button
                    type="button"
                    className="hidden sm:block hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                    aria-label="絵文字を追加"
                  >
                    <Smile size={18} className="lg:w-5 lg:h-5" />
                  </button>
                  <button
                    type="button"
                    className="hidden lg:block hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                    aria-label="スケジュールを追加"
                  >
                    <Calendar size={20} />
                  </button>
                  <button
                    type="button"
                    className="hidden lg:block hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                    aria-label="場所を追加"
                  >
                    <MapPin size={20} />
                  </button>
                </div>

                <div className="flex items-center space-x-2 lg:space-x-4">
                  <div className="text-xs lg:text-sm text-gray-500">{text.length}/280</div>
                  <button
                    type="submit"
                    disabled={!text.trim() || isSubmitting} // 🔧 送信中は無効化
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 lg:px-6 py-2 rounded-full font-semibold transition-colors text-sm lg:text-base flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>投稿中...</span>
                      </>
                    ) : (
                      <span>投稿</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* BANモーダル */}
      <BanModal />
    </>
  );
}
