import React, { useState, useRef, useMemo } from "react";
import { supabase } from "@/utils/supabase/client";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Smile,
} from "lucide-react";

// 型定義を明確化
type ReplyType = {
  id: string | number; // 🔧 文字列または数値を許可
  post_id: number;
  user_id: string;
  text: string;
  created_at: string;
  username?: string;
};

type StanpType = {
  id: string;
  post_id: string;
  user_id: string;
  stanp_url: string;
};

// 型定義を修正
type PostType = {
  id: string;
  user_id: string;
  username: string;
  title: string;
  created_at: string;
  tags: string[];
  replies: ReplyType[]; // 🔧 配列型のみ
  likes: number;
  bookmarked: boolean;
  image_url?: string;
  user_icon_url?: string;
  displayName?: string;
  setID?: string;
  stamps?: StanpType[];
};

type PostProps = {
  post: PostType;
  liked: boolean;
  bookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  stampList?: string[];
  currentUserId?: string;
  onRefresh?: () => void; // 🔧 リフレッシュ関数を追加
  currentUserName?: string; // �� 現在のユーザー名を追加
};

// 🔧 型安全なヘルパー関数を追加
const isTemporaryReply = (id: string | number): boolean => {
  return typeof id === 'string' && id.startsWith('temp-');
};

export default function Post({
  post,
  liked,
  bookmarked,
  onLike,
  onBookmark,
  stampList = [],
  currentUserId,
  onRefresh,
  currentUserName = "User" // 🔧 デフォルト値を設定
}: PostProps) {
  // ローカルstate
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 🔧 リプライの楽観的更新用のstate
  const [localReplies, setLocalReplies] = useState<ReplyType[]>(post.replies || []);
  
  // スタンプの楽観的更新用のstate
  const [localStanps, setLocalStanps] = useState<StanpType[]>(post.stamps || []);
  
  const replyInputRef = useRef<HTMLInputElement>(null);

  // 🔧 localRepliesを使用してリプライ数を計算
  const repliesCount = localReplies.length;

  // localStanpsを使用してスタンプ集計をメモ化
  const stanpCountMap = useMemo(() => {
    const map: { [url: string]: number } = {};
    localStanps.forEach((s) => {
      map[s.stanp_url] = (map[s.stanp_url] || 0) + 1;
    });
    return map;
  }, [localStanps]);

  // 🔧 リプライデータが変更された時にlocalRepliesを更新
  React.useEffect(() => {
    setLocalReplies(post.replies || []);
  }, [post.replies]);

  // スタンプデータが変更された時にlocalStanpsを更新
  React.useEffect(() => {
    setLocalStanps(post.stamps || []);
  }, [post.stamps]);

  // 🔧 楽観的更新対応のリプライ送信
  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    const trimmedText = replyText.trim();
    const tempId = `temp-${Date.now()}`; // 🔧 一意なIDを生成
    setReplyLoading(true);
    
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user_id = auth?.user?.id;
      if (!user_id) {
        alert("ログインが必要です");
        return;
      }

      // 🚀 楽観的更新: 即座にUIに反映
      const optimisticReply: ReplyType = {
        id: tempId, // 🔧 一意なIDを使用
        post_id: Number(post.id),
        user_id: user_id,
        text: trimmedText,
        created_at: new Date().toISOString(),
        username: currentUserName
      };

      // ローカル状態を即座に更新
      setLocalReplies(prev => [...prev, optimisticReply]);
      
      // 入力フィールドをクリア
      setReplyText("");
      setShowReplyInput(false);

      // バックグラウンドでDB更新
      const insertObj = {
        post_id: Number(post.id),
        user_id: user_id,
        text: trimmedText,
        created_at: new Date().toISOString(),
      };

      const { error, data } = await supabase
        .from("replies")
        .insert(insertObj)
        .select();

      if (error) {
        console.error("replies insert error:", error, insertObj);
        alert("リプライ送信に失敗しました: " + error.message);
        
        // 🔧 エラー時は楽観的更新を取り消し（正確なIDで削除）
        setLocalReplies(prev => 
          prev.filter(reply => reply.id !== tempId)
        );
        
        // 入力を復元
        setReplyText(trimmedText);
        setShowReplyInput(true);
      } else {
        // 成功時は一時的なIDを実際のIDに更新
        if (data && data[0]) {
          setLocalReplies(prev => 
            prev.map(reply => 
              reply.id === tempId 
                ? { ...reply, id: data[0].id }
                : reply
            )
          );
        }
      }
      
    } catch (error) {
      console.error("Error in handleReply:", error);
      
      // 🔧 エラー時は楽観的更新を取り消し（正確なIDで削除）
      setLocalReplies(prev => 
        prev.filter(reply => reply.id !== tempId)
      );
      
      // 入力を復元
      setReplyText(trimmedText);
      setShowReplyInput(true);
      alert("リプライ送信中にエラーが発生しました");
    } finally {
      setReplyLoading(false);
    }
  };

  // 🔧 修正されたスタンプ追加・取り消し
  const handleAddStanp = async (stanp_url: string) => {
    if (!currentUserId) {
      alert("ログインが必要です");
      return;
    }

    setLoading(true);
    
    try {
      // 既に自分が押していれば「取り消し」
      const myStanp = localStanps.find(
        (s) => s.user_id === currentUserId && s.stanp_url === stanp_url
      );

      // 🚀 楽観的更新: UIを即座に更新
      if (myStanp) {
        // ローカル状態から削除
        setLocalStanps(prev => 
          prev.filter(s => !(s.user_id === currentUserId && s.stanp_url === stanp_url))
        );
      } else {
        // ローカル状態に追加
        setLocalStanps(prev => [
          ...prev,
          { 
            id: `temp-${Date.now()}`, 
            post_id: post.id, 
            user_id: currentUserId, 
            stanp_url 
          }
        ]);
      }

      // バックグラウンドでDB更新
      if (myStanp) {
        const { error } = await supabase
          .from("stamp")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId)
          .eq("stanp_url", stanp_url);
        
        if (error) {
          // エラー時は元に戻す
          setLocalStanps(post.stamps || []);
          alert("スタンプ削除に失敗しました: " + error.message);
        }
      } else {
        const { error } = await supabase.from("stamp").insert({
          post_id: post.id,
          user_id: currentUserId,
          stanp_url,
        });
        
        if (error) {
          // エラー時は元に戻す
          setLocalStanps(post.stamps || []);
          alert("スタンプ追加に失敗しました: " + error.message);
        }
      }
      
    } catch (error) {
      console.error("Error in handleAddStanp:", error);
      // エラー時は元に戻す
      setLocalStanps(post.stamps || []);
    } finally {
      setLoading(false);
    }
  };

  // R2のパブリック開発URL
  const R2_PUBLIC_URL = "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

  // 画像URLを生成
  const getImageUrl = (image_url?: string) => {
    if (!image_url) return "";
    if (image_url.startsWith("http://") || image_url.startsWith("https://")) {
      return image_url;
    }
    const trimmed = image_url.trim();
    return `${R2_PUBLIC_URL}${trimmed}`;
  };

  // R2画像URL変換関数（ユーザーアイコン用）
  const getPublicIconUrl = (iconUrl?: string) => {
    if (!iconUrl) return "";
    if (iconUrl.includes("cloudflarestorage.com")) {
      const filename = iconUrl.split("/").pop();
      if (!filename) return "";
      return `${R2_PUBLIC_URL}${filename}`;
    }
    return iconUrl;
  };

  return (
    <div className="p-4 hover:bg-gray-900/50 transition-colors border-b border-gray-800">
      <div className="flex space-x-3">
        {/* アバター */}
        {post.user_icon_url ? (
          <a href={`/profile/${post.user_id}`}>
            <img
              src={getPublicIconUrl(post.user_icon_url)}
              alt="icon"
              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }
              }}
            />
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-80 fallback-avatar" style={{ display: 'none' }}>
              {post.displayName?.charAt(0) ?? post.username?.charAt(0) ?? "?"}
            </div>
          </a>
        ) : (
          <a href={`/profile/${post.user_id}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-80">
              {post.displayName?.charAt(0) ?? post.username?.charAt(0) ?? "?"}
            </div>
          </a>
        )}

        <div className="flex-1 min-w-0">
          {/* ユーザー情報 */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-white hover:underline cursor-pointer">
              {post.username}
            </span>
            <span className="text-gray-500 text-sm">@{post.setID}</span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-gray-500 text-sm">
              {new Date(post.created_at).toLocaleString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button className="ml-auto text-gray-500 hover:text-white transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* 投稿内容 */}
          <div className="text-white mb-3 whitespace-pre-wrap leading-relaxed">
            <span
              dangerouslySetInnerHTML={{
                __html: (post.title ?? "").replace(
                  /#([\wぁ-んァ-ン一-龠]+)/g,
                  '<span style="color:#3b82f6">#$1</span>'
                ),
              }}
            />
          </div>

          {/* 画像表示 */}
          {post.image_url && getImageUrl(post.image_url) !== "" && (
            <div className="mb-3">
              <img
                src={getImageUrl(post.image_url)}
                alt="投稿画像"
                className="max-w-xs rounded-lg"
                style={{ maxHeight: 300 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML =
                      '<div style="width:200px;height:200px;display:flex;align-items:center;justify-content:center;border:2px dashed #f87171;background:#222;color:#f87171;">画像が見つかりません</div>';
                  }
                }}
              />
            </div>
          )}

          {/* タグ */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm hover:bg-blue-500/30 cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex items-center justify-between max-w-md">
            <button
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors group"
              onClick={() => {
                setShowReplyInput(!showReplyInput);
                setTimeout(() => replyInputRef.current?.focus(), 100);
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                <MessageCircle size={20} />
              </div>
              <span className="text-sm">{repliesCount}</span>
            </button>

            <button
              onClick={onLike}
              className={`flex items-center space-x-2 transition-colors group ${
                liked ? "text-pink-500" : "text-gray-500 hover:text-pink-500"
              }`}
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  liked ? "bg-pink-500/10" : "group-hover:bg-pink-500/10"
                }`}
              >
                <Heart size={20} fill={liked ? "currentColor" : "none"} />
              </div>
              <span className="text-sm">{post.likes ?? 0}</span>
            </button>

            <button
              onClick={onBookmark}
              className={`flex items-center space-x-2 transition-colors group ${
                bookmarked
                  ? "text-green-400"
                  : "text-gray-500 hover:text-green-400"
              }`}
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  bookmarked ? "bg-green-500/10" : "group-hover:bg-green-500/10"
                }`}
              >
                <Bookmark
                  size={20}
                  fill={bookmarked ? "currentColor" : "none"}
                />
              </div>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                <Share size={20} />
              </div>
            </button>
          </div>

          {/* 🔧 修正されたリプライ一覧 */}
          <div className="mt-3 space-y-2">
            {localReplies.slice(0, 3).map((reply) => {
              // 🔧 型安全な一時的ID判定
              const isTempReply = typeof reply.id === 'string' && reply.id.startsWith('temp-');
              
              return (
                <div key={reply.id} className="flex items-start gap-2 ml-2">
                  <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {reply.username?.charAt(0) ?? "?"}
                  </div>
                  <div className={`bg-gray-800 rounded-xl px-3 py-2 text-sm text-white max-w-xs ${
                    isTempReply ? 'opacity-75' : ''
                  }`}>
                    <span className="font-semibold mr-2">
                      {reply.username ?? "User"}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(reply.created_at).toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="mt-1 whitespace-pre-wrap">{reply.text}</div>
                    {isTempReply && (
                      <div className="text-xs text-gray-500 mt-1">送信中...</div>
                    )}
                  </div>
                </div>
              );
            })}
            {localReplies.length > 3 && (
              <div className="ml-2 text-gray-400 text-sm">
                他 {localReplies.length - 3} 件のリプライ
              </div>
            )}
          </div>

          {/* リプライ入力欄 */}
          {showReplyInput && (
            <form
              className="flex items-center gap-2 mt-2 ml-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleReply();
              }}
            >
              <input
                ref={replyInputRef}
                type="text"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none"
                placeholder="リプライを入力..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={replyLoading}
                maxLength={200}
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold disabled:bg-gray-600"
                disabled={replyLoading || !replyText.trim()}
              >
                {replyLoading ? "送信中..." : "送信"}
              </button>
            </form>
          )}

          {/* スタンプ（リアクション）エリア */}
          <div className="flex items-center gap-2 mt-2 ml-2 relative">
            {/* 既存スタンプ表示 */}
            {stampList
              .filter((url) => stanpCountMap[url])
              .map((url) => {
                const isMine =
                  !!currentUserId &&
                  localStanps.some(
                    (s) => s.user_id === currentUserId && s.stanp_url === url
                  );
                return (
                  <button
                    key={url}
                    className={`relative group focus:outline-none`}
                    style={{ width: 44, height: 44 }}
                    onClick={() => handleAddStanp(url)}
                    tabIndex={0}
                    disabled={loading}
                  >
                    <img
                      src={getImageUrl(url)}
                      alt="stamp"
                      className={`w-10 h-10 object-contain border bg-black transition-all ${
                        isMine
                          ? "ring-2 ring-blue-400 ring-offset-2"
                          : "border-gray-700"
                      } ${loading ? 'opacity-50' : ''}`}
                      style={{
                        borderRadius: 8,
                        opacity: loading ? 0.5 : 1,
                        boxShadow: isMine ? "0 0 8px 2px #60a5fa" : undefined,
                      }}
                    />
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full px-1 min-w-[18px] text-center">
                      {stanpCountMap[url]}
                    </span>
                  </button>
                );
              })}

            {/* スタンプ追加ボタン */}
            <button
              className="w-7 h-7 flex items-center justify-center border border-gray-700 rounded-full bg-black hover:bg-gray-800 disabled:opacity-50"
              onClick={() => setShowStampPicker(!showStampPicker)}
              disabled={loading}
              aria-label="スタンプ追加"
            >
              <Smile size={18} />
            </button>

            {/* スタンプ一覧ポップアップ */}
            {showStampPicker && (
              <div className="absolute z-10 left-0 top-10 p-2 bg-gray-900 border border-gray-700 rounded-xl shadow-lg items-center min-w-[200px]">
                <div className="grid grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                  {stampList.map((url) => (
                    <button
                      key={url}
                      className="w-16 h-16 flex items-center justify-center hover:bg-gray-800 disabled:opacity-50"
                      onClick={() => handleAddStanp(url)}
                      disabled={loading}
                    >
                      <img
                        src={getImageUrl(url)}
                        alt="stamp"
                        className="w-14 h-14 object-contain border border-gray-700 bg-black"
                        style={{ borderRadius: 8 }}
                      />
                    </button>
                  ))}
                </div>
                <button
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
                  onClick={() => setShowStampPicker(false)}
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
