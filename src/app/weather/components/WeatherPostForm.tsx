"use client";

import { Send, X, MapPin, Cloud, Thermometer, Droplets, Wind, Eye, Loader2 } from "lucide-react";
import { NewPostData } from "../types";
import { useState, useEffect } from "react";

interface WeatherPostFormProps {
  newPost: NewPostData;
  setNewPost: (post: NewPostData) => void;
  postCoords: { lat: number; lng: number } | null;
  onSubmit: (coords: { lat: number; lng: number }) => void; // 座標を受け取るように変更
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
            errorMessage = "位置情報の許可が必要です。ブラウザの設定で位置情報を許可してください。";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置情報が利用できません。GPS機能を確認してください。";
            break;
          case error.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました。もう一度お試しください。";
            break;
        }
        
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true, // 高精度モード
        timeout: 15000, // 15秒に延長
        maximumAge: 60000 // 1分間キャッシュ
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
      setWeatherError('天気情報の取得に失敗しました。手動で入力してください。');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // コンポーネントマウント時に自動で現在地を取得
  useEffect(() => {
    // 地図クリックで位置が設定されている場合はそのまま天気取得
    if (postCoords) {
      fetchWeatherData(postCoords);
    } else {
      // 位置が設定されていない場合は現在地を取得
      getCurrentLocation();
    }
  }, []);

  const handleSubmit = () => {
    // 使用する座標を決定
    const coords = currentLocation || postCoords;
    
    if (!coords) {
      alert("位置情報が取得できていません。");
      return;
    }

    console.log("投稿ボタンクリック:", {
      weatherData: !!weatherData,
      location: newPost.location,
      comment: newPost.comment,
      coords
    });

    if (weatherData && newPost.location && newPost.comment.trim()) {
      onSubmit(coords); // 座標を渡す
    } else {
      console.error("投稿に必要な情報が不足:", {
        weatherData: !!weatherData,
        location: newPost.location,
        comment: newPost.comment
      });
      alert("天気情報の取得が完了していないか、コメントが入力されていません。");
    }
  };

  // ボタンの状態をデバッグ
  const isButtonDisabled = isLoadingWeather || isGettingLocation || !weatherData || !newPost.comment.trim();
  console.log("ボタン状態:", {
    isLoadingWeather,
    isGettingLocation,
    hasWeatherData: !!weatherData,
    hasComment: !!newPost.comment.trim(),
    isButtonDisabled
  });

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">天気を投稿</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* デバッグ情報（開発時のみ表示） */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4 text-xs">
          <div className="text-gray-400 mb-2">デバッグ情報:</div>
          <div className="space-y-1">
            <div>位置取得中: {isGettingLocation ? "はい" : "いいえ"}</div>
            <div>天気取得中: {isLoadingWeather ? "はい" : "いいえ"}</div>
            <div>天気データ: {weatherData ? "あり" : "なし"}</div>
            <div>コメント: &quot;{newPost.comment}&quot;</div>
            <div>現在地: {currentLocation ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : "なし"}</div>
            <div>地図位置: {postCoords ? `${postCoords.lat.toFixed(6)}, ${postCoords.lng.toFixed(6)}` : "なし"}</div>
            <div>ボタン状態: {isButtonDisabled ? "無効" : "有効"}</div>
          </div>
        </div>

        {/* 位置情報取得中 */}
        {isGettingLocation && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <div>
                <div className="text-blue-300 font-medium text-sm">現在地を高精度で取得中...</div>
                <div className="text-blue-400 text-xs">GPSを使用して正確な位置情報を取得しています</div>
              </div>
            </div>
          </div>
        )}

        {/* 位置情報エラー */}
        {locationError && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="text-red-300 text-sm">{locationError}</div>
            <button
              onClick={getCurrentLocation}
              className="text-red-400 text-xs hover:text-red-300 mt-2 underline"
            >
              再試行
            </button>
          </div>
        )}

        {/* 位置情報 */}
        {(currentLocation || postCoords) && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 text-blue-300">
              <MapPin size={16} />
              <span className="text-sm font-medium">投稿位置</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {(currentLocation || postCoords)!.lat.toFixed(6)}, {(currentLocation || postCoords)!.lng.toFixed(6)}
            </div>
          </div>
        )}

        {/* 天気情報取得状況 */}
        {isLoadingWeather && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
              <div>
                <div className="text-yellow-300 font-medium text-sm">天気情報を取得中...</div>
                <div className="text-yellow-400 text-xs">現在地の天気データを自動取得しています</div>
              </div>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {weatherError && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="text-red-300 text-sm">{weatherError}</div>
            <button
              onClick={() => {
                const coords = currentLocation || postCoords;
                if (coords) fetchWeatherData(coords);
              }}
              className="text-red-400 text-xs hover:text-red-300 mt-2 underline"
            >
              再試行
            </button>
          </div>
        )}

        {/* 取得された天気情報 */}
        {weatherData && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 text-green-300 mb-3">
              <Cloud size={16} />
              <span className="text-sm font-medium">現在の天気情報</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-gray-300">{weatherData.location}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-lg">{weatherIcons[weatherData.weather as keyof typeof weatherIcons]}</span>
                <span className="text-gray-300">{weatherLabels[weatherData.weather as keyof typeof weatherLabels]}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Thermometer size={14} className="text-gray-400" />
                <span className="text-gray-300">{weatherData.temperature}°C</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Droplets size={14} className="text-gray-400" />
                <span className="text-gray-300">{weatherData.humidity}%</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Wind size={14} className="text-gray-400" />
                <span className="text-gray-300">{weatherData.windSpeed}m/s</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Eye size={14} className="text-gray-400" />
                <span className="text-gray-300">{weatherData.visibility}km</span>
              </div>
            </div>
          </div>
        )}

        {/* コメント入力 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-gray-300">
            コメント（必須）
          </label>
          <textarea
            value={newPost.comment}
            onChange={(e) => setNewPost({ ...newPost, comment: e.target.value })}
            placeholder="今日の天気についてコメントを書いてください..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {/* ボタン群 */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors font-medium"
          >
            キャンセル
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className={`flex-1 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 ${
              isButtonDisabled 
                ? "bg-gray-600 cursor-not-allowed text-gray-400" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isLoadingWeather || isGettingLocation ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isGettingLocation ? "位置取得中..." : "天気取得中..."}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>投稿する</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

