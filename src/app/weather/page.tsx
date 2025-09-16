'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  CloudSun, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  Send, 
  Plus, 
  X,
  Heart,
  Map,
  List,
  Home
} from 'lucide-react';

interface WeatherPost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  location: string;
  weather: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  comment: string;
  imageUrl?: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  lat?: number;
  lng?: number;
}

export default function WeatherPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<WeatherPost[]>([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map'); // デフォルトはマップ
  const [newPost, setNewPost] = useState({
    location: '',
    weather: 'sunny',
    temperature: 20,
    humidity: 60,
    windSpeed: 5,
    visibility: 10,
    comment: '',
  });

  // モックデータ（座標情報を追加）
  useEffect(() => {
    const mockPosts: WeatherPost[] = [
      {
        id: '1',
        userId: 'user1',
        username: 'アリス',
        userAvatar: 'ア',
        location: '東京都渋谷区',
        weather: 'sunny',
        temperature: 25,
        humidity: 45,
        windSpeed: 3,
        visibility: 15,
        comment: '今日は絶好の散歩日和！桜が満開でとても綺麗です',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likes: 12,
        isLiked: false,
        lat: 35.6581,
        lng: 139.7016,
      },
      {
        id: '2',
        userId: 'user2',
        username: 'ボブ',
        userAvatar: 'ボ',
        location: '大阪府大阪市',
        weather: 'cloudy',
        temperature: 22,
        humidity: 70,
        windSpeed: 8,
        visibility: 8,
        comment: '曇り空だけど、風が気持ちいい！ジョギングに最適な天気です‍♂️',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        likes: 8,
        isLiked: true,
        lat: 34.6937,
        lng: 135.5023,
      },
      {
        id: '3',
        userId: 'user3',
        username: 'チャーリー',
        userAvatar: 'チ',
        location: '福岡県福岡市',
        weather: 'rainy',
        temperature: 18,
        humidity: 85,
        windSpeed: 12,
        visibility: 5,
        comment: '雨が降ってきました。傘を忘れずに！☔',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        likes: 15,
        isLiked: false,
        lat: 33.5904,
        lng: 130.4017,
      },
      {
        id: '4',
        userId: 'user4',
        username: 'ダイアナ',
        userAvatar: 'ダ',
        location: '北海道札幌市',
        weather: 'snowy',
        temperature: -2,
        humidity: 90,
        windSpeed: 15,
        visibility: 3,
        comment: '雪が降っています。路面が滑りやすいので注意してください！❄️',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        likes: 22,
        isLiked: false,
        lat: 43.0642,
        lng: 141.3469,
      },
    ];
    setPosts(mockPosts);
  }, []);

  const weatherIcons = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
    stormy: '⛈️',
  };

  const weatherLabels = {
    sunny: '晴れ',
    cloudy: '曇り',
    rainy: '雨',
    snowy: '雪',
    stormy: '嵐',
  };

  const handleSubmitPost = () => {
    if (!user || !newPost.location || !newPost.comment) return;

    const post: WeatherPost = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.user_metadata?.displayName || user.user_metadata?.username || 'ユーザー',
      userAvatar: user.user_metadata?.displayName?.[0] || user.user_metadata?.username?.[0] || 'ユ',
      location: newPost.location,
      weather: newPost.weather,
      temperature: newPost.temperature,
      humidity: newPost.humidity,
      windSpeed: newPost.windSpeed,
      visibility: newPost.visibility,
      comment: newPost.comment,
      createdAt: new Date(),
      likes: 0,
      isLiked: false,
      lat: 35.6762 + (Math.random() - 0.5) * 0.1, // 東京周辺のランダム座標
      lng: 139.6503 + (Math.random() - 0.5) * 0.1,
    };

    setPosts([post, ...posts]);
    setNewPost({
      location: '',
      weather: 'sunny',
      temperature: 20,
      humidity: 60,
      windSpeed: 5,
      visibility: 10,
      comment: '',
    });
    setShowPostForm(false);
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) return `${hours}時間前`;
    if (minutes > 0) return `${minutes}分前`;
    return 'たった今';
  };

  // マップビューコンポーネント
  const MapView = () => (
    <div className="relative w-full h-[600px] bg-gray-800 rounded-2xl overflow-hidden">
      {/* 簡易マップ（実際の実装ではGoogle MapsやLeafletを使用） */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-green-900">
        <div className="absolute inset-0 opacity-20">
          {/* グリッドパターン */}
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        {/* 投稿マーカー */}
        {posts.map((post) => (
          <div
            key={post.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${20 + (post.lat || 0) * 100}%`,
              top: `${20 + (post.lng || 0) * 100}%`,
            }}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-500 hover:scale-110 transition-transform">
                <span className="text-lg">{weatherIcons[post.weather as keyof typeof weatherIcons]}</span>
              </div>
              
              {/* ホバー時の詳細情報 */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
                      {post.userAvatar}
                    </div>
                    <span className="font-semibold text-sm">{post.username}</span>
                  </div>
                  <div className="text-xs text-gray-300 mb-1">{post.location}</div>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-lg">{weatherIcons[post.weather as keyof typeof weatherIcons]}</span>
                    <span className="text-sm font-medium">{post.temperature}°C</span>
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-2">{post.comment}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* マップコントロール */}
      <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-80 rounded-lg p-2">
        <div className="text-xs text-gray-300 mb-1">投稿数: {posts.length}</div>
        <div className="text-xs text-gray-400">クリックして詳細を表示</div>
      </div>
    </div>
  );

  // リストビューコンポーネント
  const ListView = () => (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          {/* ユーザー情報 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {post.userAvatar}
            </div>
            <div>
              <div className="font-semibold">{post.username}</div>
              <div className="text-sm text-gray-400">{formatTimeAgo(post.createdAt)}</div>
            </div>
          </div>

          {/* 天気情報 */}
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

          {/* コメント */}
          <div className="mb-4">
            <p className="text-gray-100 leading-relaxed">{post.comment}</p>
          </div>

          {/* アクション */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                post.isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* ホームボタンを追加 */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">ホーム</span>
            </button>
            
            <div className="flex items-center gap-3">
              <CloudSun className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold">天気投稿</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* ビューモード切り替えボタン */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'map' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Map className="w-4 h-4" />
                マップ
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                一覧
              </button>
            </div>
            
            <button
              onClick={() => setShowPostForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              投稿する
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 投稿フォーム */}
        {showPostForm && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">天気を投稿</h2>
              <button
                onClick={() => setShowPostForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">場所</label>
                <input
                  type="text"
                  value={newPost.location}
                  onChange={(e) => setNewPost({...newPost, location: e.target.value})}
                  placeholder="例: 東京都渋谷区"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">天気</label>
                <select
                  value={newPost.weather}
                  onChange={(e) => setNewPost({...newPost, weather: e.target.value})}
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
                  onChange={(e) => setNewPost({...newPost, temperature: parseInt(e.target.value)})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">湿度 (%)</label>
                <input
                  type="number"
                  value={newPost.humidity}
                  onChange={(e) => setNewPost({...newPost, humidity: parseInt(e.target.value)})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">風速 (m/s)</label>
                <input
                  type="number"
                  value={newPost.windSpeed}
                  onChange={(e) => setNewPost({...newPost, windSpeed: parseInt(e.target.value)})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">視程 (km)</label>
                <input
                  type="number"
                  value={newPost.visibility}
                  onChange={(e) => setNewPost({...newPost, visibility: parseInt(e.target.value)})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">コメント</label>
              <textarea
                value={newPost.comment}
                onChange={(e) => setNewPost({...newPost, comment: e.target.value})}
                placeholder="今日の天気についてコメントを書いてください..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
              />
            </div>

            <button
              onClick={handleSubmitPost}
              disabled={!newPost.location || !newPost.comment}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full flex items-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              投稿する
            </button>
          </div>
        )}

        {/* メインコンテンツ */}
        {viewMode === 'map' ? <MapView /> : <ListView />}
      </div>
    </div>
  );
}
