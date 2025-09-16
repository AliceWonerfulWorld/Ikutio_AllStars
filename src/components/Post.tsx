import {
  Heart,
  MessageCircle,
  Bookmark,
  Share,
  MoreHorizontal,
  Smile,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
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
  image_url?: string; // ← imageUrl → image_url に修正
  iconUrl?: string;
  displayName?: string;
  setID?: string;
};

type PostProps = {
  post: PostType;
  liked: boolean;
  bookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
};

// スタンプ型
type StanpType = {
  id: string;
  post_id: string;
  user_id: string;
  stanp_url: string;
};

export default function Post({
  post,
  liked,
  bookmarked,
  onLike,
  onBookmark,
}: PostProps) {
  // スタンプ画像リスト
  const [stampList, setStampList] = useState<string[]>([]);
  useEffect(() => {
    const fetchStampList = async () => {
      const { data, error } = await supabase
        .from("make_stamp")
        .select("make_stanp_url");
      if (!error && data) {
        setStampList(
          data.map((row: any) => row.make_stanp_url).filter(Boolean)
        );
      }
    };
    fetchStampList();
  }, []);

  // スタンプ状態
  const [stanps, setStanps] = useState<StanpType[]>([]);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // 投稿ごとのスタンプ取得
  useEffect(() => {
    const fetchStanps = async () => {
      const { data, error } = await supabase
        .from("stamp")
        .select("*")
        .eq("post_id", post.id);
      if (!error && data) setStanps(data);
    };
    fetchStanps();
  }, [post.id]);

  // スタンプ追加
  const handleAddStanp = async (stanp_url: string) => {
    setLoading(true);
    // ユーザー情報取得
    const { data: auth } = await supabase.auth.getUser();
    const user_id = auth?.user?.id;
    if (!user_id) {
      alert("ログインが必要です");
      setLoading(false);
      return;
    }
    // 既に同じスタンプを押していれば何もしない
    if (
      stanps.some((s) => s.user_id === user_id && s.stanp_url === stanp_url)
    ) {
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("stamp").insert({
      post_id: post.id,
      user_id,
      stanp_url,
    });
    if (!error) {
      setStanps((prev) => [
        ...prev,
        { id: "", post_id: post.id, user_id, stanp_url },
      ]);
    } else {
      alert("スタンプ追加に失敗しました: " + error.message);
    }
    setLoading(false);
    // setShowStampPicker(false); // ← ここは閉じない
  };

  // スタンプごとに集計
  const stanpCountMap: { [url: string]: number } = {};
  stanps.forEach((s) => {
    stanpCountMap[s.stanp_url] = (stanpCountMap[s.stanp_url] || 0) + 1;
  });

  // R2のパブリック開発URL
  const R2_PUBLIC_URL = "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

  // 画像URLを生成（投稿画像・スタンプ画像共通）
  const getImageUrl = (image_url?: string) => {
    if (!image_url) return "";
    // supabaseに格納されているのが "1757998980946_ifd2sljhhr.jpg" のようなファイル名の場合
    // すでに拡張子付きファイル名なので、そのままR2のURLを付与
    if (image_url.startsWith("http://") || image_url.startsWith("https://")) {
      return image_url;
    }
    // ファイル名の前後に空白や余計な文字が入っていないかトリム
    const trimmed = image_url.trim();
    return `${R2_PUBLIC_URL}${trimmed}`;
  };

  return (
    <div className="p-4 hover:bg-gray-900/50 transition-colors border-b border-gray-800">
      <div className="flex space-x-3">
        {/* アバター */}
        {post.iconUrl ? (
          <img
            src={post.iconUrl}
            alt="icon"
            className="w-10 h-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {post.displayName?.charAt(0) ?? post.username?.charAt(0) ?? "?"}
          </div>
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

          {/* 投稿内容（titleカラム表示・タグは青色） */}
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
                  // エラー時は周囲に枠線や背景色をつけて視認性を上げる
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
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                <MessageCircle size={20} />
              </div>
              <span className="text-sm">{post.replies || 0}</span>
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

          {/* スタンプ（リアクション）エリア */}
          <div className="flex items-center gap-2 mt-2 ml-2 relative">
            {/* 既存スタンプ表示 */}
            {stampList
              .filter((url) => stanpCountMap[url])
              .map((url) => (
                <div
                  key={url}
                  className="relative group"
                  style={{ width: 28, height: 28 }}
                >
                  <img
                    src={getImageUrl(url)}
                    alt="stamp"
                    className="w-7 h-7 object-contain rounded-full border border-gray-700 bg-black"
                    style={{ opacity: 1 }}
                  />
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full px-1 min-w-[18px] text-center">
                    {stanpCountMap[url]}
                  </span>
                </div>
              ))}
            {/* スタンプ追加ボタン */}
            <button
              className="w-7 h-7 flex items-center justify-center border border-gray-700 rounded-full bg-black hover:bg-gray-800"
              onClick={() => setShowStampPicker((v) => !v)}
              disabled={loading}
              aria-label="スタンプ追加"
            >
              <Smile size={18} />
            </button>
            {/* スタンプ一覧ポップアップ */}
            {showStampPicker && (
              <div className="absolute z-10 left-0 top-10 flex gap-4 p-2 bg-gray-900 border border-gray-700 rounded-xl shadow-lg items-center">
                {/* スタンプ選択肢 */}
                <div className="flex gap-2">
                  {stampList.map((url) => (
                    <button
                      key={url}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-full"
                      onClick={() => handleAddStanp(url)}
                      disabled={loading}
                    >
                      <img
                        src={getImageUrl(url)}
                        alt="stamp"
                        className="w-7 h-7 object-contain"
                      />
                    </button>
                  ))}
                </div>
                {/* 既に選択・追加されたスタンプ一覧 */}
                <div className="flex gap-1 items-center border-l border-gray-700 pl-2 min-w-[40px]">
                  {stampList.filter((url) => stanpCountMap[url]).length > 0 ? (
                    stampList
                      .filter((url) => stanpCountMap[url])
                      .map((url) => (
                        <div
                          key={url}
                          className="relative"
                          style={{ width: 24, height: 24 }}
                        >
                          <img
                            src={getImageUrl(url)}
                            alt="added-stamp"
                            className="w-6 h-6 object-contain rounded-full border border-gray-700 bg-black"
                          />
                          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] rounded-full px-1 min-w-[14px] text-center">
                            {stanpCountMap[url]}
                          </span>
                        </div>
                      ))
                  ) : (
                    <span className="text-xs text-gray-400">未追加</span>
                  )}
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
