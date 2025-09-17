"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Users, 
  Settings,
  Phone,
  PhoneOff,
  Wine, // BARらしいアイコンに変更
  Headphones,
  Speaker,
  UserPlus,
  Crown,
  Heart,
  Coffee, // カフェのような雰囲気も追加
  MessageCircle // 談笑のイメージ
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SpaceUser {
  id: string;
  name: string;
  avatar?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isHost: boolean;
  joinedAt: number;
}

interface Space {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  participants: number;
  isLive: boolean;
  startedAt: number;
  category: string;
}

export default function TikuriBarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isInSpace, setIsInSpace] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [spaceUsers, setSpaceUsers] = useState<SpaceUser[]>([]);

  // モックデータ
  const liveSpaces: Space[] = [
    {
      id: "1",
      title: "深夜のまったりトーク",
      description: "今日あった出来事をゆるく話しましょう",
      hostId: "host1",
      hostName: "あきら",
      participants: 12,
      isLive: true,
      startedAt: Date.now() - 3600000,
      category: "雑談"
    },
    {
      id: "2", 
      title: "プログラミング質問室",
      description: "コーディングの悩みを相談しよう",
      hostId: "host2",
      hostName: "テックマスター",
      participants: 8,
      isLive: true,
      startedAt: Date.now() - 1800000,
      category: "技術"
    },
    {
      id: "3",
      title: "音楽好き集まれ！",
      description: "最近聞いている音楽を紹介し合おう",
      hostId: "host3", 
      hostName: "メロディ",
      participants: 15,
      isLive: true,
      startedAt: Date.now() - 7200000,
      category: "音楽"
    }
  ];

  const mockSpaceUsers: SpaceUser[] = [
    {
      id: "host1",
      name: "あきら",
      isSpeaking: true,
      isMuted: false,
      isHost: true,
      joinedAt: Date.now() - 3600000
    },
    {
      id: "user2",
      name: "さくら",
      isSpeaking: false,
      isMuted: false,
      isHost: false,
      joinedAt: Date.now() - 2400000
    },
    {
      id: "user3",
      name: "たろう",
      isSpeaking: false,
      isMuted: true,
      isHost: false,
      joinedAt: Date.now() - 1800000
    },
    {
      id: "user4",
      name: "ゆうこ",
      isSpeaking: false,
      isMuted: false,
      isHost: false,
      joinedAt: Date.now() - 900000
    }
  ];

  const joinSpace = (space: Space) => {
    setCurrentSpace(space);
    setSpaceUsers(mockSpaceUsers);
    setIsInSpace(true);
  };

  const leaveSpace = () => {
    setCurrentSpace(null);
    setSpaceUsers([]);
    setIsInSpace(false);
    setIsMuted(false);
    setIsDeafened(false);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    }
    return `${minutes}分`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <Mic size={48} className="mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">TikuriBARにアクセス</h1>
          <p className="text-gray-400 mb-6">音声チャットを楽しむにはログインが必要です</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            ログインする
          </button>
        </div>
      </div>
    );
  }

  if (isInSpace && currentSpace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
        {/* ヘッダー */}
        <div className="bg-black/50 backdrop-blur-md border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Home size={20} />
                <span>ホーム</span>
              </button>
              <div>
                <h1 className="text-xl font-bold">{currentSpace.title}</h1>
                <p className="text-gray-400 text-sm">{currentSpace.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {spaceUsers.length}人が参加中
              </span>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-400">LIVE</span>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* メインエリア */}
          <div className="flex-1 p-6">
            {/* スピーカー表示エリア */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Crown size={20} className="mr-2 text-yellow-500" />
                ホスト・スピーカー
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {spaceUsers.filter(u => u.isHost || u.isSpeaking).map((user) => (
                  <div
                    key={user.id}
                    className={`relative p-4 rounded-xl border transition-all duration-300 ${
                      user.isSpeaking 
                        ? 'bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/25' 
                        : 'bg-gray-800/50 border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
                        {user.name.charAt(0)}
                      </div>
                      <p className="text-white font-medium">{user.name}</p>
                      {user.isHost && (
                        <div className="flex items-center justify-center mt-1">
                          <Crown size={14} className="text-yellow-500 mr-1" />
                          <span className="text-xs text-yellow-500">ホスト</span>
                        </div>
                      )}
                    </div>
                    {user.isMuted && (
                      <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                        <MicOff size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* リスナー表示エリア */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Headphones size={20} className="mr-2 text-blue-500" />
                リスナー ({spaceUsers.filter(u => !u.isHost && !u.isSpeaking).length}人)
              </h2>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {spaceUsers.filter(u => !u.isHost && !u.isSpeaking).map((user) => (
                  <div key={user.id} className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-medium mx-auto mb-1">
                      {user.name.charAt(0)}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{user.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 下部コントロール */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-gray-700 p-4">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-all duration-300 ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={isMuted ? "ミュート解除" : "ミュート"}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            
            <button
              onClick={() => setIsDeafened(!isDeafened)}
              className={`p-3 rounded-full transition-all duration-300 ${
                isDeafened 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={isDeafened ? "スピーカー有効" : "スピーカー無効"}
            >
              {isDeafened ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            <button
              onClick={leaveSpace}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <PhoneOff size={20} />
              <span>退出</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* ヘッダー */}
      <div className="bg-black/50 backdrop-blur-md border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Home size={20} />
              <span>ホーム</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-lg">
                <Wine size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                TikuriBAR
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* ライブスペース一覧 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Wine size={24} className="mr-2 text-amber-500" />
            ライブ中のスペース
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveSpaces.map((space) => (
              <div
                key={space.id}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                onClick={() => joinSpace(space)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-sm font-medium">LIVE</span>
                  </div>
                  <span className="text-gray-400 text-sm">{space.category}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2">{space.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{space.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {space.hostName.charAt(0)}
                    </div>
                    <span className="text-gray-300 text-sm">{space.hostName}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400 text-sm">
                    <Users size={16} />
                    <span>{space.participants}</span>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  {formatDuration(Date.now() - space.startedAt)}前から開始
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* スペース作成ボタン */}
        <div className="text-center">
          <button
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25 flex items-center space-x-3 mx-auto"
          >
            <Wine size={24} />
            <span className="text-lg font-semibold">新しいBARを開く</span>
          </button>
        </div>
      </div>
    </div>
  );
}
