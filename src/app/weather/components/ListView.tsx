"use client";

import { Heart, MapPin, Thermometer, Droplets, Wind, Eye } from "lucide-react";
import { WeatherPost, weatherIcons, weatherLabels } from "../types";
import { formatTimeAgo } from "../utils/helpers";

interface ListViewProps {
  posts: WeatherPost[];
  onLike: (postId: string) => void;
}

export default function ListView({ posts, onLike }: ListViewProps) {
  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={`${post.id}-${post.createdAt?.valueOf?.() ?? ""}`} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {post.userAvatar}
            </div>
            <div>
              <div className="font-semibold">{post.username}</div>
              <div className="text-sm text-gray-400">{formatTimeAgo(post.createdAt)}</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{post.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{weatherIcons[post.weather as keyof typeof weatherIcons]}</span>
                <span className="font-semibold">{weatherLabels[post.weather as keyof typeof weatherLabels]}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-red-400" />
                <span>{post.temperature}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>{post.humidity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-green-400" />
                <span>{post.windSpeed}m/s</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-yellow-400" />
                <span>{post.visibility}km</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-100 leading-relaxed">{post.comment}</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                post.isLiked ? "bg-red-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Heart className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`} />
              <span>{post.likes}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
