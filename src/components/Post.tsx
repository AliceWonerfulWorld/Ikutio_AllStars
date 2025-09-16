import {
  Heart,
  MessageCircle,
  Bookmark,
  Share,
  MoreHorizontal,
} from "lucide-react";
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
  imageUrl?: string;
  iconUrl?: string;
  displayName?: string;
  setID?: string; // 追加
};

type PostProps = {
  post: PostType;
  liked: boolean;
  bookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
};

export default function Post({
  post,
  liked,
  bookmarked,
  onLike,
  onBookmark,
}: PostProps) {
  console.log("画像URL:", post.imageUrl);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "たった今";
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`;
    } else {
      return date.toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      });
    }
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
          {post.imageUrl &&
            post.imageUrl !== "" &&
            post.imageUrl.startsWith("https://") && (
              <div className="mb-3">
                <img
                  src={post.imageUrl}
                  alt="投稿画像"
                  className="max-w-xs rounded-lg"
                  style={{ maxHeight: 300 }}
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
              <span className="text-sm">{post.likes ?? 0}</span> {/* ← 追加 */}
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
        </div>
      </div>
    </div>
  );
}
