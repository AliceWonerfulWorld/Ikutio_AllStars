"use client";

import { useState } from "react";
import Link from "next/link";
import { CloudSun, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ViewMode, NewPostData } from "./types";
import { useWeatherPosts } from "./hooks/useWeatherPosts";
import WeatherHeader from "./components/WeatherHeader";
import WeatherPostForm from "./components/WeatherPostForm";
import MapView from "./components/MapView";
import ListView from "./components/ListView";

export default function WeatherPage() {
  const { user } = useAuth();
  const { posts, submitPost, handleLike } = useWeatherPosts();
  
  const [showPostForm, setShowPostForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [postCoords, setPostCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newPost, setNewPost] = useState<NewPostData>({
    location: "",
    weather: "sunny",
    temperature: 20,
    humidity: 60,
    windSpeed: 5,
    visibility: 10,
    comment: "",
  });

  // 未ログインの場合の表示
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
        {/* 背景パターン */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%233B82F6%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        {/* ホームに戻るボタン */}
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          zIndex: 50,
        }}>
          <Link
            href="/"
            className="flex items-center space-x-2 bg-gray-800/90 hover:bg-gray-700/90 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-gray-600/50 shadow-lg cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <Home size={20} />
            <span className="font-semibold">ホームに戻る</span>
          </Link>
        </div>
        
        {/* メインコンテンツ */}
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            {/* アイコン */}
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-500/30 backdrop-blur-sm">
                <CloudSun size={64} className="text-blue-400" />
              </div>
            </div>
            
            {/* タイトル */}
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              会員限定制
            </h1>
            
            {/* 説明文 */}
            <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-600/30">
              <p className="text-gray-300 text-lg mb-4">
                天気Yohoo!は会員様限定の<br />
                特別なサービスです
              </p>
              <p className="text-gray-400 text-sm">
                ログインして、リアルタイム天気情報を<br />
                投稿・共有しましょう
              </p>
            </div>
            
            {/* ボタン群 */}
            <div className="flex flex-row gap-4 justify-center">
              <Link 
                href="/auth/login"
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                <CloudSun size={20} />
                <span>ログインして利用開始</span>
              </Link>
              
              <Link 
                href="/auth/signup"
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span>新規会員登録</span>
              </Link>
            </div>
            
            {/* 追加情報 */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-xs">
                ※ 会員登録は無料です
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 投稿処理（座標を受け取る）
  const handleSubmitPost = async (coords: { lat: number; lng: number }) => {
    try {
      console.log("投稿処理開始:", { newPost, coords });
      await submitPost(newPost, coords, user);
      
      // フォームをリセット
      setNewPost({
        location: "",
        weather: "sunny",
        temperature: 20,
        humidity: 60,
        windSpeed: 5,
        visibility: 10,
        comment: "",
      });
      setPostCoords(null);
      setShowPostForm(false);
      
      console.log("投稿完了");
    } catch (error) {
      console.error("投稿エラー:", error);
      // エラーは useWeatherPosts 内で処理済み
    }
  };

  // 地図クリックは無効化（右上のボタンからのみ投稿可能）
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    // 地図クリックでは投稿フォームを開かない
    console.log("地図クリック:", coords);
  };

  const handleCloseForm = () => {
    setShowPostForm(false);
    setPostCoords(null);
  };

  // 投稿フォームを開く関数
  const handleCreatePost = () => {
    setPostCoords(null); // 地図クリック位置はリセット
    setShowPostForm(true);
  };

  // ログイン済みの場合の通常表示
  return (
    <div className="min-h-screen bg-black text-white">
      <WeatherHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onCreatePost={handleCreatePost}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {showPostForm && (
          <WeatherPostForm
            newPost={newPost}
            setNewPost={setNewPost}
            postCoords={postCoords}
            onSubmit={handleSubmitPost}
            onClose={handleCloseForm}
          />
        )}

        {viewMode === "map" ? (
          <MapView posts={posts} onMapClick={handleMapClick} />
        ) : (
          <ListView posts={posts} onLike={handleLike} />
        )}
      </div>
    </div>
  );
}
