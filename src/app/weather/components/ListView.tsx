"use client";

import { Heart, MapPin, Thermometer, Droplets, Wind, Eye, MessageCircle, Share2, Bookmark } from "lucide-react";
import { WeatherPost, weatherIcons, weatherLabels } from "../types";
import { formatTimeAgo } from "../utils/helpers";
import CommentSection from "./CommentSection";

interface ListViewProps {
  posts: WeatherPost[];
  onLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onLikeComment: (commentId: string) => void;
}

export default function ListView({ posts, onLike, onAddComment, onLikeComment }: ListViewProps) {
  // 天気に応じた背景グラデーションを取得
  const getWeatherGradient = (weather: string) => {
    switch (weather) {
      case 'sunny':
        return 'from-yellow-500/20 via-orange-500/10 to-amber-500/20';
      case 'cloudy':
        return 'from-gray-500/20 via-slate-500/10 to-gray-600/20';
      case 'rainy':
        return 'from-blue-500/20 via-indigo-500/10 to-purple-500/20';
      case 'snowy':
        return 'from-cyan-500/20 via-blue-500/10 to-indigo-500/20';
      case 'stormy':
        return 'from-purple-500/20 via-red-500/10 to-orange-500/20';
      default:
        return 'from-gray-500/20 via-slate-500/10 to-gray-600/20';
    }
  };

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <div 
          key={`${post.id}-${post.createdAt?.valueOf?.() ?? ""}`} 
          className="group relative overflow-hidden"
        >
          {/* 背景グラデーション */}
          <div className={`absolute inset-0 bg-gradient-to-br ${getWeatherGradient(post.weather)} opacity-50 rounded-3xl`}></div>
          
          {/* メインコンテンツ */}
          <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-black/20">
            
            {/* ヘッダー部分 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* アバター */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {post.userAvatar}
                  </div>
                  {/* オンライン状態インジケーター */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
                
                <div>
                  <div className="font-bold text-lg text-white">{post.username}</div>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                    {formatTimeAgo(post.createdAt)}
                  </div>
                </div>
              </div>

              {/* 天気アイコン（右上） */}
              <div className="flex flex-col items-center">
                <div className="text-4xl mb-1">{weatherIcons[post.weather as keyof typeof weatherIcons]}</div>
                <div className="text-xs text-gray-400 font-medium">{weatherLabels[post.weather as keyof typeof weatherLabels]}</div>
              </div>
            </div>

            {/* 位置情報 */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium">{post.location}</span>
            </div>

            {/* 天気データグリッド */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 hover:bg-gray-700/60 transition-colors group/item">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Thermometer className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{post.temperature}°</div>
                    <div className="text-xs text-gray-400">気温</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 hover:bg-gray-700/60 transition-colors group/item">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Droplets className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{post.humidity}%</div>
                    <div className="text-xs text-gray-400">湿度</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 hover:bg-gray-700/60 transition-colors group/item">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Wind className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{post.windSpeed}</div>
                    <div className="text-xs text-gray-400">風速 m/s</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 hover:bg-gray-700/60 transition-colors group/item">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Eye className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{post.visibility}</div>
                    <div className="text-xs text-gray-400">視程 km</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 投稿コメント部分 */}
            {post.comment && (
              <div className="mb-6">
                <div className="bg-gray-800/40 rounded-2xl p-4 border border-gray-700/30">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-100 leading-relaxed text-lg">{post.comment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* いいねボタン */}
                <button
                  onClick={() => onLike(post.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    post.isLiked 
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/25" 
                      : "bg-gray-700/60 text-gray-300 hover:bg-red-500/20 hover:text-red-400 border border-gray-600/50"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.isLiked ? "fill-current" : ""}`} />
                  <span className="font-medium">{post.likes}</span>
                </button>

                {/* シェアボタン */}
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700/60 text-gray-300 hover:bg-green-500/20 hover:text-green-400 border border-gray-600/50 transition-all duration-200 transform hover:scale-105">
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">シェア</span>
                </button>
              </div>

              {/* ブックマークボタン */}
              <button className="p-2 rounded-xl bg-gray-700/60 text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400 border border-gray-600/50 transition-all duration-200">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>

            {/* コメントセクション（投稿の下に配置） */}
            <CommentSection
              postId={post.id}
              comments={post.comments || []}
              onAddComment={onAddComment}
              onLikeComment={onLikeComment}
            />
          </div>
        </div>
      ))}

      {/* 投稿がない場合の表示 */}
      {posts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🌤️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">まだ投稿がありません</h3>
          <p className="text-gray-500">最初の天気投稿をしてみませんか？</p>
        </div>
      )}
    </div>
  );
}
