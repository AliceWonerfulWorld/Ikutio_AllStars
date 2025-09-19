"use client";

import { useState } from "react";
import { Heart, Send, User, X } from "lucide-react";
import { PostComment } from "../types";
import { formatTimeAgo } from "../utils/helpers";
import { useAuth } from "@/contexts/AuthContext";

interface CommentSectionProps {
  postId: string;
  comments: PostComment[];
  onAddComment: (postId: string, content: string) => void;
  onLikeComment: (commentId: string) => void;
}

export default function CommentSection({ 
  postId, 
  comments, 
  onAddComment, 
  onLikeComment 
}: CommentSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await onAddComment(postId, newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error("コメント投稿エラー:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mt-4">
      {/* コメントボタン - 常に表示 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700/60 text-gray-300 hover:bg-blue-500/20 hover:text-blue-400 border border-gray-600/50 transition-all duration-200 transform hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="font-medium">コメント</span>
        {comments.length > 0 && (
          <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
            {comments.length}
          </span>
        )}
        {isOpen && (
          <X className="w-4 h-4 ml-1" />
        )}
      </button>

      {/* コメントセクション */}
      {isOpen && (
        <div className="mt-4 bg-gray-800/40 rounded-2xl border border-gray-700/30 overflow-hidden">
          {/* コメント入力 */}
          {user && (
            <div className="p-4 border-b border-gray-700/30">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user.user_metadata?.displayName?.[0] || user.user_metadata?.username?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="コメントを入力..."
                    rows={2}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white resize-none focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleSubmit}
                      disabled={!newComment.trim() || isSubmitting}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>送信中...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>送信</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* コメント一覧 */}
          <div className="max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>まだコメントがありません</p>
                <p className="text-sm">最初のコメントを残してみませんか？</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/30">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 hover:bg-gray-700/20 transition-colors">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {comment.userAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white text-sm">{comment.username}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-100 text-sm leading-relaxed mb-2">{comment.content}</p>
                        <button
                          onClick={() => onLikeComment(comment.id)}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            comment.isLiked 
                              ? "text-red-400" 
                              : "text-gray-400 hover:text-red-400"
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${comment.isLiked ? "fill-current" : ""}`} />
                          <span>{comment.likes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}