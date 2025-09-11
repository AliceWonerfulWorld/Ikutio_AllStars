import {
  Heart,
  MessageCircle,
  Bookmark,
  Share,
  MoreHorizontal,
} from "lucide-react";
import { Post as PostType } from "@/types";

interface PostProps {
  post: PostType;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
}

export default function Post({ post, onLike, onBookmark }: PostProps) {
  console.log(post);

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
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold">
          {post.username.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* ユーザー情報 */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-white hover:underline cursor-pointer">
              {post.username}
            </span>
            <span className="text-gray-500 text-sm">@{post.username}</span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-gray-500 text-sm">
              {formatDate(post.created_at)}
            </span>
            <button className="ml-auto text-gray-500 hover:text-white transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* 投稿内容（todosテーブルのtitle） */}
          <div className="text-white mb-3 whitespace-pre-wrap leading-relaxed">
            {post.text}
          </div>

          {/* タグ */}
          {Array.isArray(post.tags) && post.tags.length > 0 && (
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
              onClick={() => onLike(post.id)}
              className="flex items-center space-x-2 text-gray-500 hover:text-red-400 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                <Heart size={20} />
              </div>
              <span className="text-sm">{post.likes}</span>
            </button>

            <button
              onClick={() => onBookmark(post.id)}
              className={`flex items-center space-x-2 transition-colors group ${
                post.bookmarked
                  ? "text-green-400"
                  : "text-gray-500 hover:text-green-400"
              }`}
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  post.bookmarked
                    ? "bg-green-500/10"
                    : "group-hover:bg-green-500/10"
                }`}
              >
                <Bookmark
                  size={20}
                  fill={post.bookmarked ? "currentColor" : "none"}
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
