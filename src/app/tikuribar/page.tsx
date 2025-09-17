"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Users, 
  PhoneOff,
  Wine,
  Crown,
  Coffee,
  MessageCircle,
  Sparkles
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-amber-900/20 text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23D97706%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full mb-6 backdrop-blur-sm border border-amber-500/30">
            <Wine size={64} className="mx-auto text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
            TikuriBARへようこそ
          </h1>
          <p className="text-gray-300 mb-8 text-lg">音声で繋がる、大人の社交場</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25 flex items-center space-x-3 mx-auto"
          >
            <Wine size={24} />
            <span className="text-lg font-semibold">BARに入店する</span>
          </button>
        </div>
      </div>
    );
  }

  if (isInSpace && currentSpace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-amber-900/20 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23D97706%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M40%200c22.091%200%2040%2017.909%2040%2040S62.091%2080%2040%2080%200%2062.091%200%2040%2017.909%200%2040%200zm0%208c-17.673%200-32%2014.327-32%2032s14.327%2032%2032%2032%2032-14.327%2032-32S57.673%208%2040%208z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        {/* ヘッダー */}
        <div className="bg-black/60 backdrop-blur-xl border-b border-amber-500/20 p-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="group flex items-center space-x-2 bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/80 hover:to-gray-600/80 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-gray-600/50"
              >
                <Home size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                <span>ホーム</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-amber-500/80 to-orange-500/80 rounded-xl shadow-lg backdrop-blur-sm">
                  <Wine size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{currentSpace.title}</h1>
                  <p className="text-amber-300 text-sm">{currentSpace.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-amber-500/20">
              <Users size={16} className="text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">
                {spaceUsers.length}人が参加中
              </span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-sm font-bold">LIVE</span>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-80px)] relative z-10">
          <div className="flex-1 p-6">
            {/* バーカウンター風スピーカーエリア */}
            <div className="bg-gradient-to-br from-amber-900/20 via-black/60 to-orange-900/20 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/30 mb-6 shadow-2xl shadow-amber-500/10">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-amber-500/80 to-orange-500/80 rounded-xl mr-4 shadow-lg">
                  <Crown size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                  バーカウンター
                </h2>
                <div className="ml-4 text-amber-400 text-sm">
                  〜 話し手の席 〜
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {spaceUsers.filter(u => u.isHost || u.isSpeaking).map((spaceUser) => (
                  <div
                    key={spaceUser.id}
                    className={`relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                      spaceUser.isSpeaking 
                        ? 'bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-amber-600/30 border-2 border-amber-400/60 shadow-2xl shadow-amber-500/30' 
                        : 'bg-gradient-to-br from-gray-800/40 via-black/60 to-gray-700/40 border border-amber-500/20 backdrop-blur-sm'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-lg ${
                        spaceUser.isHost 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                          : 'bg-gradient-to-br from-amber-600 to-orange-600'
                      }`}>
                        {spaceUser.name.charAt(0)}
                      </div>
                      <p className="text-white font-semibold text-lg">{spaceUser.name}</p>
                      {spaceUser.isHost && (
                        <div className="flex items-center justify-center mt-2 bg-amber-500/20 rounded-full px-3 py-1">
                          <Crown size={14} className="text-amber-400 mr-1" />
                          <span className="text-xs text-amber-300 font-medium">バーテンダー</span>
                        </div>
                      )}
                    </div>
                    {spaceUser.isSpeaking && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-2 shadow-lg animate-pulse">
                        <MessageCircle size={16} className="text-white" />
                      </div>
                    )}
                    {spaceUser.isMuted && (
                      <div className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-sm rounded-full p-2 border border-red-400/50">
                        <MicOff size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ラウンジエリア風リスナー表示 */}
            <div className="bg-gradient-to-br from-gray-800/30 via-black/60 to-amber-900/10 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/20 shadow-2xl shadow-amber-500/5">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-gray-600/80 to-gray-700/80 rounded-xl mr-4 shadow-lg">
                  <Coffee size={24} className="text-amber-300" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  ラウンジエリア
                </h2>
                <div className="ml-4 text-amber-400 text-sm">
                  〜 {spaceUsers.filter(u => !u.isHost && !u.isSpeaking).length}人がくつろぎ中 〜
                </div>
              </div>
              
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                {spaceUsers.filter(u => !u.isHost && !u.isSpeaking).map((spaceUser) => (
                  <div key={spaceUser.id} className="text-center group">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-600/60 to-gray-700/60 rounded-full flex items-center justify-center text-white font-medium mx-auto mb-2 backdrop-blur-sm border border-amber-500/20 transition-all duration-300 group-hover:scale-110 group-hover:border-amber-400/40 shadow-lg">
                      {spaceUser.name.charAt(0)}
                    </div>
                    <p className="text-xs text-gray-300 truncate group-hover:text-amber-300 transition-colors duration-300">{spaceUser.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BAR風コントロールパネル */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-black/90 via-amber-900/20 to-black/90 backdrop-blur-xl border-t border-amber-500/30 p-6 relative z-20">
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`group p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm border ${
                isMuted 
                  ? 'bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-400/80 hover:to-red-500/80 shadow-red-500/30 border-red-400/50' 
                  : 'bg-gradient-to-r from-gray-700/80 to-gray-800/80 hover:from-amber-600/80 hover:to-orange-600/80 shadow-gray-500/20 border-gray-600/50 hover:border-amber-400/50'
              }`}
              title={isMuted ? "ミュート解除" : "ミュート"}
            >
              {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
            
            <button
              onClick={() => setIsDeafened(!isDeafened)}
              className={`group p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm border ${
                isDeafened 
                  ? 'bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-400/80 hover:to-red-500/80 shadow-red-500/30 border-red-400/50' 
                  : 'bg-gradient-to-r from-gray-700/80 to-gray-800/80 hover:from-amber-600/80 hover:to-orange-600/80 shadow-gray-500/20 border-gray-600/50 hover:border-amber-400/50'
              }`}
              title={isDeafened ? "スピーカー有効" : "スピーカー無効"}
            >
              {isDeafened ? <VolumeX size={28} /> : <Volume2 size={28} />}
            </button>

            <button
              onClick={leaveSpace}
              className="group bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500/80 hover:to-red-600/80 text-white px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/30 flex items-center space-x-3 backdrop-blur-sm border border-red-400/50"
            >
              <PhoneOff size={24} />
              <span className="text-lg font-semibold">退店</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-amber-900/20 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23D97706%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      {/* ヘッダー */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-amber-500/30 p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push("/")}
              className="group flex items-center space-x-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/80 hover:to-gray-600/80 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-gray-600/50 shadow-lg"
            >
              <Home size={20} className="group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-semibold">ホーム</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-amber-500/80 to-orange-500/80 rounded-2xl shadow-xl backdrop-blur-sm border border-amber-400/50">
                <Wine size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                  TikuriBAR
                </h1>
                <p className="text-amber-400 text-lg font-medium">〜 大人の社交場 〜</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 relative z-10">
        {/* ライブスペース一覧 */}
        <div className="mb-12">
          <div className="flex items-center mb-8">
            <div className="p-3 bg-gradient-to-r from-amber-500/80 to-orange-500/80 rounded-xl mr-4 shadow-lg">
              <Sparkles size={28} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
              営業中のBAR
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {liveSpaces.map((space) => (
              <div
                key={space.id}
                className="group bg-gradient-to-br from-amber-900/20 via-black/60 to-orange-900/20 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/30 hover:border-amber-400/60 transition-all duration-500 transform hover:scale-105 cursor-pointer shadow-2xl hover:shadow-amber-500/20"
                onClick={() => joinSpace(space)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3 bg-red-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-red-400/30">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                    <span className="text-red-300 text-sm font-bold">LIVE</span>
                  </div>
                  <div className="bg-amber-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-amber-400/30">
                    <span className="text-amber-300 text-sm font-medium">{space.category}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-100 transition-colors duration-300">
                  {space.title}
                </h3>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">{space.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {space.hostName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-white font-medium">{space.hostName}</span>
                      <p className="text-amber-400 text-xs">バーテンダー</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800/40 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-600/30">
                    <Users size={16} className="text-amber-400" />
                    <span className="text-amber-300 font-medium">{space.participants}</span>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-amber-500/80 text-center bg-black/30 rounded-full py-2 backdrop-blur-sm">
                  {formatDuration(Date.now() - space.startedAt)}前から営業中
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* スペース作成ボタン */}
        <div className="text-center">
          <button
            className="group bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500/80 hover:to-orange-500/80 text-white px-12 py-6 rounded-2xl transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-amber-500/30 flex items-center space-x-4 mx-auto backdrop-blur-sm border border-amber-400/50"
          >
            <Wine size={28} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-xl font-bold">新しいBARを開店</span>
            <Sparkles size={24} className="group-hover:animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
}
