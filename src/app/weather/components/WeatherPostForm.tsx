"use client";

import { Send, X } from "lucide-react";
import { NewPostData } from "../types";

interface WeatherPostFormProps {
  newPost: NewPostData;
  setNewPost: (post: NewPostData) => void;
  postCoords: { lat: number; lng: number } | null;
  onSubmit: () => void;
  onClose: () => void;
}

export default function WeatherPostForm({
  newPost,
  setNewPost,
  postCoords,
  onSubmit,
  onClose,
}: WeatherPostFormProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">天気を投稿</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {postCoords && (
        <div className="text-xs text-gray-400 mb-3">
          位置: {postCoords.lat.toFixed(5)}, {postCoords.lng.toFixed(5)}（地図クリックで取得）
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">場所</label>
          <input
            type="text"
            value={newPost.location}
            onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
            placeholder="例: 東京都渋谷区"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">天気</label>
          <select
            value={newPost.weather}
            onChange={(e) => setNewPost({ ...newPost, weather: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="sunny">☀️ 晴れ</option>
            <option value="cloudy">☁️ 曇り</option>
            <option value="rainy">🌧️ 雨</option>
            <option value="snowy">❄️ 雪</option>
            <option value="stormy">⛈️ 嵐</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">気温 (°C)</label>
          <input
            type="number"
            value={newPost.temperature}
            onChange={(e) => setNewPost({ ...newPost, temperature: parseInt(e.target.value) })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">湿度 (%)</label>
          <input
            type="number"
            value={newPost.humidity}
            onChange={(e) => setNewPost({ ...newPost, humidity: parseInt(e.target.value) })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">風速 (m/s)</label>
          <input
            type="number"
            value={newPost.windSpeed}
            onChange={(e) => setNewPost({ ...newPost, windSpeed: parseInt(e.target.value) })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">視程 (km)</label>
          <input
            type="number"
            value={newPost.visibility}
            onChange={(e) => setNewPost({ ...newPost, visibility: parseInt(e.target.value) })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">コメント</label>
        <textarea
          value={newPost.comment}
          onChange={(e) => setNewPost({ ...newPost, comment: e.target.value })}
          placeholder="今日の天気についてコメントを書いてください..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!newPost.location || !newPost.comment}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full flex items-center gap-2 transition-colors"
      >
        <Send className="w-4 h-4" />
        投稿する
      </button>
    </div>
  );
}

