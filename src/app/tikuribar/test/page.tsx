"use client";

import { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function TikuriBarTestPage() {
  const [username, setUsername] = useState('');
  const [barTitle, setBarTitle] = useState('');
  const [message, setMessage] = useState('');
  
  const {
    isConnected,
    currentBar,
    users,
    messages,
    availableBars,
    connect,
    disconnect,
    createBar,
    joinBar,
    sendMessage,
    leaveBar,
    getBars
  } = useWebSocket();

  const handleConnect = () => {
    if (!isConnected) {
      connect();
    }
  };

  const handleCreateBar = () => {
    if (!username || !barTitle) {
      alert('ユーザー名とBAR名を入力してください');
      return;
    }
    createBar(barTitle, username);
  };

  const handleJoinBar = (barId: string) => {
    if (!username) {
      alert('ユーザー名を入力してください');
      return;
    }
    joinBar(barId, username);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🍷 TikuriBAR WebSocket テスト
        </h1>

        {/* 接続状態 */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg">接続状態: </span>
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? '✅ 接続中' : '❌ 未接続'}
              </span>
            </div>
            <button
              onClick={isConnected ? disconnect : handleConnect}
              className={`px-4 py-2 rounded-lg ${
                isConnected 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isConnected ? '切断' : '接続'}
            </button>
          </div>
        </div>

        {/* ユーザー名入力 */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <label className="block text-sm font-medium mb-2">ユーザー名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="あなたの名前を入力"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          />
        </div>

        {!currentBar ? (
          // BAR一覧・作成画面
          <div className="space-y-6">
            {/* BAR作成 */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-bold mb-4">🏗️ 新しいBAR作成</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={barTitle}
                  onChange={(e) => setBarTitle(e.target.value)}
                  placeholder="BAR名を入力"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                />
                <button
                  onClick={handleCreateBar}
                  disabled={!isConnected}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 px-6 py-2 rounded-lg"
                >
                  作成
                </button>
              </div>
            </div>

            {/* 利用可能なBAR一覧 */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">🍺 営業中のBAR</h2>
                <button
                  onClick={getBars}
                  disabled={!isConnected}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-sm"
                >
                  更新
                </button>
              </div>
              
              {availableBars.length === 0 ? (
                <p className="text-gray-400">営業中のBARはありません</p>
              ) : (
                <div className="space-y-2">
                  {availableBars.map((bar) => (
                    <div key={bar.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-semibold">{bar.title}</div>
                        <div className="text-sm text-gray-400">
                          {bar.userCount}人が参加中
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinBar(bar.id)}
                        disabled={!isConnected || !username}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
                      >
                        参加
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // BAR内画面
          <div className="space-y-6">
            {/* BAR情報 */}
            <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">🍷 BAR内 (ID: {currentBar})</h2>
                  <p className="text-amber-300">{users.length}人が参加中</p>
                </div>
                <button
                  onClick={leaveBar}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                >
                  退店
                </button>
              </div>
            </div>

            {/* 参加者一覧 */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">👥 参加者</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {users.map((user) => (
                  <div key={user.id} className="p-3 bg-gray-700 rounded-lg text-center">
                    <div className="text-sm font-medium">{user.username}</div>
                    <div className="text-xs text-gray-400">
                      {user.role === 'bartender' ? '🍸 バーテンダー' : 
                       user.role === 'speaker' ? '🎤 話し手' : '👂 リスナー'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* チャット */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">💬 チャット</h3>
              
              {/* メッセージ一覧 */}
              <div className="h-60 overflow-y-auto mb-4 p-3 bg-gray-900 rounded-lg">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-center">まだメッセージがありません</p>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className="mb-2">
                      <span className="font-semibold text-blue-400">
                        {msg.user.username}:
                      </span>
                      <span className="ml-2">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>

              {/* メッセージ入力 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="メッセージを入力..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
