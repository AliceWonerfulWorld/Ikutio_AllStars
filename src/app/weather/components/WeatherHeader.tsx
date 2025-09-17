"use client";

import { useRouter } from "next/navigation";
import { CloudSun, Home, Map, List, Plus } from "lucide-react";
import { ViewMode } from "../types";

interface WeatherHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onCreatePost: () => void;
}

export default function WeatherHeader({
  viewMode,
  setViewMode,
  onCreatePost,
}: WeatherHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">ホーム</span>
          </button>

          <div className="flex items-center gap-3">
            <CloudSun className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">天気Yohoo!投稿</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === "map" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Map className="w-4 h-4" />
              マップ
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
              一覧
            </button>
          </div>

          <button
            onClick={onCreatePost}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            投稿する
          </button>
        </div>
      </div>
    </div>
  );
}