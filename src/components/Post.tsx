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
// 🔧 共通型定義をインポート
import { PostComponentType, ReplyType, StanpType } from "@/types/post";

type PostProps = {
  post: PostComponentType; // 🔧 専用の型を使用
  liked: boolean;
  bookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  stampList?: string[];
  currentUserId?: string | null; // 🔧 null も許可
  onRefresh?: () => void;
  currentUserName?: string;
};

// 🔧 型安全なヘルパー関数を追加
const isTemporaryReply = (id: string): boolean => {
  return id.startsWith('temp-');
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
  currentUserName = "User"
}: PostProps) {
  // ローカルstate
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false); // 🚀 リプライ表示/非表示制御
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
    // 🔧 null チェックを追加
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
              className={`flex items-center space-x-2 transition-colors group ${
                showReplies ? "text-blue-400" : "text-gray-500 hover:text-blue-400"
              }`}
              onClick={() => {
                if (localReplies.length > 0) {
                  // 🚀 リプライがある場合は表示切り替え
                  setShowReplies(!showReplies);
                } else {
                  // リプライがない場合は入力欄を表示
                  setShowReplyInput(!showReplyInput);
                setTimeout(() => replyInputRef.current?.focus(), 100);
                }
              }}
            >
              <div className={`p-2 rounded-full transition-colors ${
                showReplies ? "bg-blue-500/10" : "group-hover:bg-blue-500/10"
              }`}>
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

          {/* 🚀 シンプルなインタラクションエリア */}
          <div className="mt-3 space-y-3">
            {/* 折りたたみ可能なリプライ一覧（ヘッダーなし） */}
            {localReplies.length > 0 && (
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showReplies ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="space-y-3 ml-2">
                  {localReplies.map((reply) => {
                    const isTempReply = typeof reply.id === 'string' && reply.id.startsWith('temp-');
                    
                    return (
                      <div key={reply.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {reply.username?.charAt(0) ?? "?"}
                        </div>
                        <div className={`bg-gray-800/40 backdrop-blur-sm rounded-xl px-4 py-3 text-sm text-white flex-1 border border-gray-700/20 ${
                          isTempReply ? 'opacity-75' : ''
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-sm text-blue-300">
                              {reply.username ?? "User"}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {new Date(reply.created_at).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isTempReply && (
                              <span className="text-yellow-400 text-xs flex items-center space-x-1">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                                <span>送信中</span>
                              </span>
                            )}
                          </div>
                          <div className="text-gray-200 leading-relaxed">
                            {reply.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* リプライ追加ボタン（リプライ表示時のみ） */}
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setShowReplyInput(!showReplyInput);
                        setTimeout(() => replyInputRef.current?.focus(), 100);
                      }}
                      className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm transition-colors group w-full justify-center py-2 border border-blue-400/20 rounded-lg hover:bg-blue-500/5"
                    >
                      <MessageCircle size={16} />
                      <span>リプライを追加</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* スタンプセクション */}
            {Object.keys(stanpCountMap).filter(url => stanpCountMap[url] > 0).length > 0 && (
              <div className="ml-2">
                <div className="flex flex-wrap gap-2">
                  {stampList
                    .filter((url) => (stanpCountMap[url] || 0) > 0)
                    .map((url) => {
                      const count = stanpCountMap[url] || 0;
                      const isMine =
                        !!currentUserId &&
                        localStanps.some(
                          (s) => s.user_id === currentUserId && s.stanp_url === url
                        );
                      
                      return (
                        <button
                          key={url}
                          className={`group flex items-center space-x-2 px-3 py-2 rounded-full transition-all duration-300 text-sm border ${
                            isMine
                              ? "bg-blue-500/20 border-blue-400/50 text-blue-300 shadow-lg shadow-blue-500/20"
                              : "bg-gray-800/40 border-gray-600/30 text-gray-300 hover:bg-gray-700/40 hover:border-gray-500/50"
                          } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                          onClick={() => handleAddStanp(url)}
                          disabled={loading}
                        >
                          <img
                            src={getImageUrl(url)}
                            alt="stamp"
                            className="w-5 h-5 object-contain"
                          />
                          <span className="font-medium">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  
                  {/* スタンプ追加ボタン */}
                  <button
                    className="flex items-center space-x-2 px-3 py-2 rounded-full bg-gray-800/30 border border-gray-600/20 text-gray-400 hover:text-gray-200 hover:bg-gray-700/30 hover:border-gray-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    onClick={() => setShowStampPicker(!showStampPicker)}
                    disabled={loading}
                  >
                    <Smile size={16} />
                    <span className="text-sm">追加</span>
                  </button>
                </div>
              </div>
            )}

            {/* リプライ入力欄 */}
            {showReplyInput && (
              <div className="ml-2">
                <form
                  className="flex items-center gap-3 bg-gray-900/40 border border-gray-700/30 rounded-xl p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleReply();
                  }}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {currentUserName?.charAt(0) ?? "U"}
                  </div>
                  <input
                    ref={replyInputRef}
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-sm"
                    placeholder="リプライを入力..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={replyLoading}
                    maxLength={200}
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold disabled:bg-gray-600 transition-all duration-300 hover:scale-105 flex-shrink-0"
                    disabled={replyLoading || !replyText.trim()}
                  >
                    {replyLoading ? "送信中..." : "送信"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* 🚀 改善されたスタンプピッカー（重複削除） */}
          {showStampPicker && (
            <div className="absolute z-20 left-4 top-full mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 p-4 min-w-[320px] max-w-[400px]">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Smile size={18} className="text-yellow-400" />
                  <span className="text-white font-semibold">リアクションを選択</span>
                </div>
                <button
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50 transition-all"
                  onClick={() => setShowStampPicker(false)}
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>

              {/* スタンプグリッド */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {stampList.map((url) => {
                  const count = stanpCountMap[url] || 0;
                  const isMine = !!currentUserId && localStanps.some(
                    (s) => s.user_id === currentUserId && s.stanp_url === url
                  );
                  
                return (
                    <button
                      key={url}
                      className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${
                        isMine
                          ? "bg-blue-500/20 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20"
                          : "bg-gray-800/40 border border-gray-600/30 hover:bg-gray-700/40 hover:border-gray-500/50"
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                      onClick={() => handleAddStanp(url)}
                      disabled={loading}
                    >
                      <img
                        src={getImageUrl(url)}
                        alt="stamp"
                        className="w-8 h-8 object-contain"
                      />
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
                </div>

              {/* 使用中スタンプサマリー */}
              {Object.keys(stanpCountMap).filter(url => stanpCountMap[url] > 0).length > 0 && (
                <div className="border-t border-gray-700/50 pt-3">
                  <div className="text-xs text-gray-400 mb-2">この投稿のリアクション:</div>
                  <div className="flex flex-wrap gap-1">
                    {stampList
                      .filter((url) => (stanpCountMap[url] || 0) > 0)
                      .map((url) => (
                        <div
                          key={url}
                          className="flex items-center space-x-1 bg-gray-800/60 rounded-full px-2 py-1"
                        >
                          <img
                            src={getImageUrl(url)}
                            alt="used-stamp"
                            className="w-4 h-4 object-contain"
                          />
                          <span className="text-xs text-white font-medium">
                            {stanpCountMap[url]}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              </div>
            )}

          {/* 🗑️ 古いリプライ・スタンプ表示を削除 */}
          {/* 
以下のセクションがあれば削除してください：
- リプライ一覧
- スタンプ（リアクション）エリア  
- 重複したスタンプピッカー
*/}
        </div>
      </div>
    </div>
  );
}
