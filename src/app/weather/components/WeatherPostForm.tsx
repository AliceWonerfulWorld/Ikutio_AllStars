"use client";

import { Send, X, MapPin, Loader2, CheckCircle } from "lucide-react";
import { NewPostData } from "../types";
import { useState, useEffect } from "react";

interface WeatherPostFormProps {
  newPost: NewPostData;
  setNewPost: (post: NewPostData) => void;
  postCoords: { lat: number; lng: number } | null;
  onSubmit: (coords: { lat: number; lng: number }) => void;
  onClose: () => void;
}

interface WeatherData {
  location: string;
  weather: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  description: string;
}

export default function WeatherPostForm({
  newPost,
  setNewPost,
  postCoords,
  onSubmit,
  onClose,
}: WeatherPostFormProps) {
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 現在地を取得する関数（高精度設定）
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("位置情報サービスが利用できません");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        
        console.log("位置情報取得完了:", {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy + "m"
        });
        
        setCurrentLocation(newLocation);
        setIsGettingLocation(false);
        
        // 現在地が取得できたら天気情報も取得
        fetchWeatherData(newLocation);
      },
      (error) => {
        console.error("位置情報取得エラー:", error);
        let errorMessage = "位置情報を取得できませんでした";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "位置情報の許可が必要です";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置情報が利用できません";
            break;
          case error.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました";
            break;
        }
        
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  // 天気情報を取得する関数
  const fetchWeatherData = async (coords: { lat: number; lng: number }) => {
    setIsLoadingWeather(true);
    setWeatherError(null);

    try {
      console.log("天気情報取得開始:", coords);
      const response = await fetch(
        `/api/weather?lat=${coords.lat}&lng=${coords.lng}`
      );

      if (!response.ok) {
        throw new Error('天気情報の取得に失敗しました');
      }

      const data: WeatherData = await response.json();
      setWeatherData(data);

      // フォームデータを自動で更新
      setNewPost({
        ...newPost,
        location: data.location,
        weather: data.weather,
        temperature: data.temperature,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        visibility: data.visibility,
      });

      console.log("天気情報取得完了:", data);

    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeatherError('天気情報の取得に失敗しました。');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // コンポーネントマウント時に自動で現在地を取得
  useEffect(() => {
    if (postCoords) {
      fetchWeatherData(postCoords);
    } else {
      getCurrentLocation();
    }
  }, []);

  const handleSubmit = () => {
    const coords = currentLocation || postCoords;
    
    if (!coords) {
      alert("位置情報が取得できていません。");
      return;
    }

    if (weatherData && newPost.location && newPost.comment.trim()) {
      onSubmit(coords);
    } else {
      alert("天気情報の取得が完了していないか、コメントが入力されていません。");
    }
  };

  const isButtonDisabled = isLoadingWeather || isGettingLocation || !weatherData || !newPost.comment.trim();

  const weatherIcons = {
    sunny: "☀️",
    cloudy: "☁️",
    rainy: "🌧️",
    snowy: "❄️",
    stormy: "⛈️",
  };

  const weatherLabels = {
    sunny: "晴れ",
    cloudy: "曇り",
    rainy: "雨",
    snowy: "雪",
    stormy: "嵐",
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 w-full max-w-lg border border-gray-700/50 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">
              天気を投稿
            </h2>
            <p className="text-gray-400 text-sm mt-1">現在の天気を共有しましょう</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ローディング状態 */}
        {(isGettingLocation || isLoadingWeather) && (
          <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 border border-gray-600/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-600/30 to-gray-500/30 rounded-full opacity-50 animate-pulse"></div>
              </div>
              <div>
                <div className="text-gray-200 font-medium">
                  {isGettingLocation ? "現在地を取得中..." : "天気情報を取得中..."}
                </div>
                <div className="text-gray-400 text-sm">
                  {isGettingLocation ? "GPSを使用して正確な位置を取得しています" : "リアルタイムの天気データを取得しています"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* エラー状態 */}
        {(locationError || weatherError) && (
          <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-900/40 to-red-800/40 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-red-300 font-medium">エラーが発生しました</div>
                <div className="text-red-400 text-sm">
                  {locationError || weatherError}
                </div>
                <button
                  onClick={() => {
                    if (locationError) {
                      getCurrentLocation();
                    } else {
                      const coords = currentLocation || postCoords;
                      if (coords) fetchWeatherData(coords);
                    }
                  }}
                  className="text-red-300 text-sm hover:text-red-200 mt-2 underline"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 天気情報表示 */}
        {weatherData && (
          <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 border border-gray-600/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center relative">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="text-gray-200 font-medium">天気情報を取得しました</div>
                <div className="text-gray-400 text-sm">{weatherData.location}</div>
              </div>
            </div>
            
            {/* 天気サマリー */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{weatherIcons[weatherData.weather as keyof typeof weatherIcons]}</span>
                  <div>
                    <div className="text-gray-100 font-semibold text-lg">{weatherLabels[weatherData.weather as keyof typeof weatherLabels]}</div>
                    <div className="text-gray-400 text-sm">{weatherData.temperature}°C</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 text-xs">湿度</div>
                  <div className="text-gray-200 font-medium">{weatherData.humidity}%</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">風速</span>
                  <span className="text-gray-200">{weatherData.windSpeed}m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">視程</span>
                  <span className="text-gray-200">{weatherData.visibility}km</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* コメント入力 */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-3 text-gray-300">
            コメント <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <textarea
              value={newPost.comment}
              onChange={(e) => setNewPost({ ...newPost, comment: e.target.value })}
              placeholder="今日の天気についてコメントを書いてください..."
              rows={4}
              className="w-full bg-gradient-to-br from-gray-800/60 to-gray-700/60 border border-gray-600/50 rounded-2xl px-4 py-3 text-white resize-none focus:border-gray-500 focus:outline-none transition-all duration-200 focus:from-gray-800/80 focus:to-gray-700/80"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              {newPost.comment.length}/500
            </div>
          </div>
        </div>

        {/* ボタン群 */}
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-gray-700/60 to-gray-600/60 hover:from-gray-600/60 hover:to-gray-500/60 text-white py-4 rounded-2xl transition-all duration-200 font-medium border border-gray-600/50"
          >
            キャンセル
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className={`flex-1 py-4 rounded-2xl transition-all duration-200 font-medium flex items-center justify-center space-x-2 ${
              isButtonDisabled 
                ? "bg-gradient-to-r from-gray-600/50 to-gray-500/50 cursor-not-allowed text-gray-400 border border-gray-600/30" 
                : "bg-gradient-to-r from-slate-600 to-blue-700 hover:from-slate-500 hover:to-blue-600 text-white shadow-lg hover:shadow-slate-500/25 transform hover:scale-[1.02] border border-slate-500/30"
            }`}
          >
            {isLoadingWeather || isGettingLocation ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>準備中...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>投稿する</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

