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
  PhoneOff,
  Wine,
  Crown,
  Coffee,
  MessageCircle,
  Sparkles,
  Radio,
  X,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "./hooks/useWebSocket";
import { useBarAudio } from "./hooks/useBarAudio";

export default function TikuriBarPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // WebSocket機能
  const {
    isConnected,
    currentBar,
    users,
    availableBars,
    connect,
    createBar,
    joinBar,
    sendMessage,
    leaveBar,
    getBars
  } = useWebSocket();

  // 音声機能
  const {
    isRecording,
    isMuted,
    isDeafened,
    audioLevel,
    setWebSocket,
    startRecording,
    stopRecording,
    toggleMute,
    toggleDeafen,
    handleAudioChunk
  } = useBarAudio();

  // ローカル状態
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBarTitle, setNewBarTitle] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  
  // 退店確認ダイアログの状態
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // WebSocket接続時に音声フックを設定
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected) {
        console.log('TikuriBAR: WebSocket接続を開始...');
        connect();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isConnected, connect]);

  useEffect(() => {
    if (isConnected && (window as any).wsInstance) {
      setWebSocket((window as any).wsInstance);
      (window as any).handleAudioChunk = handleAudioChunk;
      (window as any).isDeafened = isDeafened;
    }
  }, [isConnected, setWebSocket, handleAudioChunk, isDeafened]);

  const handleCreateBar = () => {
    if (!user || !newBarTitle.trim()) {
      alert("BAR名を入力してください");
      return;
    }
    
    const username = user.user_metadata?.displayName || user.user_metadata?.username || "バーテンダー";
    createBar(newBarTitle, username);
    setNewBarTitle("");
    setShowCreateForm(false);
  };

  const handleJoinBar = (barId: string) => {
    if (!user) {
      alert("ログインが必要です");
      return;
    }
    
    const username = user.user_metadata?.displayName || user.user_metadata?.username || "お客さん";
    joinBar(barId, username);
  };

  const handleLeaveBar = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeaveBar = () => {
    stopRecording();
    leaveBar();
    setShowLeaveConfirm(false);
  };

  const cancelLeaveBar = () => {
    setShowLeaveConfirm(false);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    sendMessage(chatMessage);
    setChatMessage("");
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    }
    return `${minutes}分`;
  };

  // 退店確認ダイアログコンポーネント
  const LeaveConfirmDialog = () => {
    if (!showLeaveConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 via-black to-amber-900/20 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30 shadow-2xl shadow-red-500/20 max-w-md w-full relative">
          {/* 閉じるボタン */}
          <button
            onClick={cancelLeaveBar}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* アイコン */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full border border-red-500/30">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
          </div>

          {/* タイトル */}
          <h3 className="text-2xl font-bold text-white text-center mb-4">
            退店の確認
          </h3>

          {/* メッセージ */}
          <div className="text-center mb-8">
            <p className="text-gray-300 text-lg mb-2">
              本当にTikuriBARから退店しますか？
            </p>
            <p className="text-gray-400 text-sm">
              現在の会話が終了し、録音も停止されます。
            </p>
          </div>

          {/* ボタン */}
          <div className="flex space-x-4">
            <button
              onClick={cancelLeaveBar}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <span className="font-semibold">キャンセル</span>
            </button>
            <button
              onClick={confirmLeaveBar}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/30 flex items-center justify-center space-x-2"
            >
              <PhoneOff size={20} />
              <span className="font-semibold">退店する</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-amber-900/20 text-white flex items-center justify-center relative overflow-hidden">
        {/* 背景パターン */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23D97706%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        {/* ホームに戻るボタン */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => router.push("/")}
            className="group flex items-center space-x-2 bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/80 hover:to-gray-600/80 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-gray-600/50 shadow-lg"
          >
            <Home size={20} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-semibold">ホームに戻る</span>
          </button>
        </div>
        
        {/* メインコンテンツ */}
        <div className="text-center relative z-10 max-w-md mx-auto px-6">
          {/* ロックアイコン */}
          <div className="p-6 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full mb-6 backdrop-blur-sm border border-red-500/30 mx-auto w-fit">
            <Crown size={64} className="mx-auto text-red-400" />
          </div>
          
          {/* タイトル */}
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-300 to-red-400 bg-clip-text text-transparent">
            会員限定制
          </h1>
          
          {/* 説明文 */}
          <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-600/30">
            <p className="text-gray-300 text-lg mb-4">
              TikuriBARは会員様限定の<br />
              特別なサービスです
            </p>
            <p className="text-gray-400 text-sm">
              ログインして、音声で繋がる大人の社交場を<br />
              お楽しみください
            </p>
          </div>
          
          {/* ログインボタン */}
          <div className="space-y-4">
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25 flex items-center justify-center space-x-3"
            >
              <Wine size={24} />
              <span className="text-lg font-semibold">ログインして入店</span>
            </button>
            
            <button
              onClick={() => router.push("/auth/signup")}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <span className="font-semibold">新規会員登録</span>
            </button>
          </div>
          
          {/* 追加情報 */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              ※ 会員登録は無料です
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentBar) {
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
                  <h1 className="text-xl font-bold text-white">BAR内</h1>
                  <p className="text-amber-300 text-sm">ID: {currentBar}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-amber-500/20">
              <Users size={16} className="text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">
                {users.length}人が参加中
              </span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-sm font-bold">LIVE</span>
            </div>
          </div>
        </div>

        {/* メインコンテンツエリア - コントロールパネル用のスペースを確保 */}
        <div className="flex flex-col h-[calc(100vh-80px)] relative z-10">
          {/* スクロール可能なコンテンツエリア */}
          <div className="flex-1 overflow-y-auto p-6 pb-24">
            {/* 音声状態表示 - コンパクト版 */}
            <div className="bg-gradient-to-br from-amber-900/20 via-black/60 to-orange-900/20 backdrop-blur-xl rounded-2xl p-4 border border-amber-500/30 mb-4 shadow-2xl shadow-amber-500/10">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-gradient-to-r from-amber-500/80 to-orange-500/80 rounded-lg mr-3 shadow-lg">
                  <Radio size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                  音声状態
                </h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className={`text-lg mb-1 ${isRecording ? 'text-green-400' : 'text-gray-400'}`}>
                    {isRecording ? '🎤' : '🔇'}
                  </div>
                  <div className="text-xs text-white">
                    {isRecording ? '録音中' : '停止中'}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg mb-1 ${isMuted ? 'text-red-400' : 'text-green-400'}`}>
                    {isMuted ? '🔇' : '🎤'}
                  </div>
                  <div className="text-xs text-white">
                    {isMuted ? 'ミュート' : 'マイクON'}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg mb-1 ${isDeafened ? 'text-red-400' : 'text-green-400'}`}>
                    {isDeafened ? '🔇' : '🔊'}
                  </div>
                  <div className="text-xs text-white">
                    {isDeafened ? 'スピーカーOFF' : 'スピーカーON'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg mb-1">📊</div>
                  <div className="text-xs text-white mb-1">
                    音声レベル: {audioLevel}%
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-green-400 h-1.5 rounded-full transition-all duration-100"
                      style={{ width: `${audioLevel}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* バーカウンター風スピーカーエリア - コンパクト版 */}
            <div className="bg-gradient-to-br from-amber-900/20 via-black/60 to-orange-900/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/30 mb-4 shadow-2xl shadow-amber-500/10">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-r from-amber-500/80 to-orange-500/80 rounded-lg mr-3 shadow-lg">
                  <Crown size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                  バーカウンター
                </h2>
                <div className="ml-3 text-amber-400 text-sm">
                  〜 話し手の席 〜
                </div>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {users.filter(u => u.role === 'bartender' || isRecording).map((user) => (
                  <div
                    key={user.id}
                    className={`relative p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      isRecording && user.id === (window as any).currentUserId
                        ? 'bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-amber-600/30 border-2 border-amber-400/60 shadow-2xl shadow-amber-500/30' 
                        : 'bg-gradient-to-br from-gray-800/40 via-black/60 to-gray-700/40 border border-amber-500/20 backdrop-blur-sm'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2 shadow-lg ${
                        user.role === 'bartender'
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                          : 'bg-gradient-to-br from-amber-600 to-orange-600'
                      }`}>
                        {user.username.charAt(0)}
                      </div>
                      <p className="text-white font-semibold text-sm">{user.username}</p>
                      {user.role === 'bartender' && (
                        <div className="flex items-center justify-center mt-1 bg-amber-500/20 rounded-full px-2 py-0.5">
                          <Crown size={12} className="text-amber-400 mr-1" />
                          <span className="text-xs text-amber-300 font-medium">バーテンダー</span>
                        </div>
                      )}
                    </div>
                    {isRecording && user.id === (window as any).currentUserId && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-1.5 shadow-lg animate-pulse">
                        <MessageCircle size={12} className="text-white" />
                      </div>
                    )}
                    {user.isMuted && (
                      <div className="absolute top-1 right-1 bg-red-500/80 backdrop-blur-sm rounded-full p-1 border border-red-400/50">
                        <MicOff size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ラウンジエリア風リスナー表示 - コンパクト版 */}
            <div className="bg-gradient-to-br from-gray-800/30 via-black/60 to-amber-900/10 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/20 shadow-2xl shadow-amber-500/5">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-r from-gray-600/80 to-gray-700/80 rounded-lg mr-3 shadow-lg">
                  <Coffee size={20} className="text-amber-300" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  ラウンジエリア
                </h2>
                <div className="ml-3 text-amber-400 text-sm">
                  〜 {users.filter(u => u.role !== 'bartender' && !isRecording).length}人がくつろぎ中 〜
                </div>
              </div>
              
              <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-3">
                {users.filter(u => u.role !== 'bartender' && !(isRecording && u.id === (window as any).currentUserId)).map((user) => (
                  <div key={user.id} className="text-center group">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-600/60 to-gray-700/60 rounded-full flex items-center justify-center text-white font-medium mx-auto mb-1 backdrop-blur-sm border border-amber-500/20 transition-all duration-300 group-hover:scale-110 group-hover:border-amber-400/40 shadow-lg">
                      {user.username.charAt(0)}
                    </div>
                    <p className="text-xs text-gray-300 truncate group-hover:text-amber-300 transition-colors duration-300">{user.username}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BAR風コントロールパネル - 常に表示 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-black via-amber-900/40 to-black backdrop-blur-xl border-t border-amber-500/30 px-8 py-6 relative z-20 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-center space-x-6 max-w-4xl mx-auto">
              {/* 録音開始/停止 */}
              <button
                onClick={handleToggleRecording}
                className={`group p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm border ${
                  isRecording 
                    ? 'bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-400/80 hover:to-red-500/80 shadow-red-500/30 border-red-400/50 animate-pulse' 
                    : 'bg-gradient-to-r from-green-600/80 to-green-700/80 hover:from-green-500/80 hover:to-green-600/80 shadow-green-500/20 border-green-400/50'
                }`}
                title={isRecording ? '録音停止' : '録音開始'}
              >
                <Radio size={28} />
              </button>

              <button
                onClick={toggleMute}
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
                onClick={toggleDeafen}
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
                onClick={handleLeaveBar}
                className="group bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500/80 hover:to-red-600/80 text-white px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/30 flex items-center space-x-3 backdrop-blur-sm border border-red-400/50"
              >
                <PhoneOff size={24} />
                <span className="font-semibold text-lg">退店</span>
              </button>
            </div>
          </div>
        </div>

        {/* 退店確認ダイアログ */}
        <LeaveConfirmDialog />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-amber-900/20 text-white relative overflow-hidden">
      {/* 背景アニメーション */}
      <div className="absolute inset-0 overflow-hidden">
        {/* バーライフ風の背景パターン */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23D97706%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M40%200c22.091%200%2040%2017.909%2040%2040S62.091%2080%2040%2080%200%2062.091%200%2040%2017.909%200%2040%200zm0%208c-17.673%200-32%2014.327-32%2032s14.327%2032%2032%2032%2032-14.327%2032-32S57.673%208%2040%208z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        {/* 浮遊する光のパーティクル */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400 rounded-full animate-pulse opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* 動的なグラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-900/10 to-transparent animate-pulse opacity-50"></div>
        
        {/* ワイングラス風の装飾要素 */}
        <div className="absolute top-20 right-20 w-32 h-32 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-amber-400/20 to-orange-600/20 rounded-full blur-3xl animate-bounce"></div>
        </div>
        <div className="absolute bottom-20 left-20 w-24 h-24 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-orange-400/20 to-amber-600/20 rounded-full blur-2xl animate-pulse"></div>
        </div>
      </div>
      
      {/* ヘッダー */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-amber-500/30 p-5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="group flex items-center space-x-2 bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/80 hover:to-gray-600/80 text-white px-5 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-gray-600/50 shadow-lg"
            >
              <Home size={18} className="group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-medium">ホーム</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-r from-amber-500/80 to-orange-500/80 rounded-lg shadow-lg backdrop-blur-sm border border-amber-400/50">
                <Wine size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2.5xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                  TikuriBAR
                </h1>
                <p className="text-amber-400 text-sm font-medium">〜 音声で繋がる社交場 〜</p>
              </div>
            </div>
          </div>
          
          {/* 接続状態表示 */}
          <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm rounded-lg px-3.5 py-2 border border-amber-500/20">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-amber-300 text-sm font-medium">
              {isConnected ? '接続中' : '未接続'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-7 relative z-10">
        {/* 魅力的なウェルカムセクション */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full mb-7 backdrop-blur-sm border border-amber-500/30 shadow-xl shadow-amber-500/20">
            <Wine size={32} className="text-amber-400" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 bg-clip-text text-transparent mb-5">
            Welcome to TikuriBAR
          </h2>
          <p className="text-lg text-amber-200 mb-7 max-w-xl mx-auto leading-relaxed">
            高級バーのような雰囲気で、音声を通じて新しい出会いと会話を楽しむ特別な空間へようこそ
          </p>
          <div className="flex items-center justify-center space-x-6 text-amber-300">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-sm">リアルタイム音声</span>
            </div>
            <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-sm">高品質音声</span>
            </div>
            <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-sm">プライベート空間</span>
            </div>
          </div>
        </div>

        {/* ライブスペース一覧 */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center">
              <div className="p-2.5 bg-gradient-to-r from-amber-500/80 to-orange-500/80 rounded-lg mr-3 shadow-lg">
                <Sparkles size={22} className="text-white" />
              </div>
              <h2 className="text-2.5xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                営業中のBAR
              </h2>
            </div>
            
            <button
              onClick={getBars}
              disabled={!isConnected}
              className="bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500/80 hover:to-orange-500/80 disabled:from-gray-600/80 disabled:to-gray-700/80 text-white px-5 py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25 flex items-center space-x-2 backdrop-blur-sm border border-amber-400/50"
            >
              <Sparkles size={18} />
              <span className="font-medium">更新</span>
            </button>
          </div>

          {/* バーリスト */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {availableBars.map((bar) => (
              <div
                key={bar.id}
                onClick={() => handleJoinBar(bar.id)}
                className="group bg-gradient-to-br from-amber-900/20 via-black/60 to-orange-900/20 backdrop-blur-xl rounded-xl p-5 border border-amber-500/30 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {bar.title}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Users size={16} className="text-amber-400" />
                    <span className="text-amber-300 text-sm">{bar.userCount}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  開店時間: {new Date(bar.createdAt).toLocaleTimeString('ja-JP')}
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 text-sm font-medium">LIVE</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 新しいBAR開店ボタン */}
        <div className="text-center">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={!isConnected}
              className="group bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500/80 hover:to-orange-500/80 disabled:from-gray-600/80 disabled:to-gray-700/80 text-white px-10 py-5 rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-xl hover:shadow-amber-500/30 flex items-center space-x-4 mx-auto backdrop-blur-sm border border-amber-400/50 relative overflow-hidden"
            >
              <Wine size={26} className="group-hover:rotate-12 transition-transform duration-300 relative z-10" />
              <span className="text-xl font-bold relative z-10">新しいBARを開店</span>
              <Sparkles size={22} className="group-hover:animate-pulse relative z-10" />
            </button>
          ) : (
            <div className="bg-gradient-to-br from-amber-900/20 via-black/60 to-orange-900/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/30 max-w-md mx-auto shadow-xl shadow-amber-500/10">
              <h3 className="text-lg font-bold text-white mb-4 text-center">新しいBAR開店</h3>
              <input
                type="text"
                value={newBarTitle}
                onChange={(e) => setNewBarTitle(e.target.value)}
                placeholder="BAR名を入力..."
                className="w-full bg-gray-800/60 border border-amber-500/30 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateBar()}
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateBar}
                  disabled={!newBarTitle.trim() || !isConnected}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25"
                >
                  開店
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewBarTitle("");
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
