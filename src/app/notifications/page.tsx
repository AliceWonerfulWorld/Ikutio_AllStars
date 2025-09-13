'use client';

import { useState } from 'react';
import { ArrowLeft, Settings, Check, X } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Notification from '@/components/Notification';
import { mockNotifications } from '@/data/mockNotificationData';
import { Notification as NotificationType } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex max-w-7xl mx-auto">
        {/* 左サイドバー */}
        <div className="w-64 flex-shrink-0 h-screen sticky top-0">
          <Sidebar />
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl border-r border-gray-800">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="hover:bg-gray-800 p-2 rounded-full transition-colors">
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold">通知</h1>
                {unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMarkAllAsRead}
                  className="hover:bg-gray-800 p-2 rounded-full transition-colors"
                  title="すべて既読にする"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={handleClearAll}
                  className="hover:bg-gray-800 p-2 rounded-full transition-colors"
                  title="すべて削除"
                >
                  <X size={18} />
                </button>
                <Link
                  href="/settings"
                  className="hover:bg-gray-800 p-2 rounded-full transition-colors"
                  title="通知設定"
                >
                  <Settings size={18} />
                </Link>
              </div>
            </div>

            {/* フィルター */}
            <div className="flex space-x-4 mt-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-500 hover:text-white hover:bg-gray-800'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-500 hover:text-white hover:bg-gray-800'
                }`}
              >
                未読のみ
                {unreadCount > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 通知一覧 */}
          <div>
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-6xl mb-4">🔔</div>
                <h2 className="text-xl font-semibold mb-2">
                  {filter === 'unread' ? '未読の通知がありません' : '通知がありません'}
                </h2>
                <p>
                  {filter === 'unread' 
                    ? 'すべての通知を読みました。' 
                    : '新しい通知が届いたら、ここに表示されます。'
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Notification
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))
            )}
          </div>
        </div>
        
        {/* 右サイドバー */}
        <div className="w-80 flex-shrink-0 h-screen sticky top-0 p-4">
          <div className="sticky top-4">
            {/* 通知統計 */}
            <div className="bg-gray-800 rounded-2xl p-4 mb-6">
              <h2 className="text-xl font-bold mb-4">通知統計</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">総通知数</span>
                  <span className="text-white font-semibold">
                    {notifications.length}件
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">未読</span>
                  <span className="text-blue-400 font-semibold">
                    {unreadCount}件
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">既読</span>
                  <span className="text-gray-400 font-semibold">
                    {notifications.length - unreadCount}件
                  </span>
                </div>
              </div>
            </div>

            {/* 通知タイプ別統計 */}
            <div className="bg-gray-800 rounded-2xl p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3">通知タイプ</h3>
              <div className="space-y-2">
                {['like', 'follow', 'mention', 'reply', 'bookmark', 'system'].map((type) => {
                  const count = notifications.filter(n => n.type === type).length;
                  const unreadCount = notifications.filter(n => n.type === type && !n.read).length;
                  
                  return (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{type}</span>
                      <div className="flex space-x-2">
                        {unreadCount > 0 && (
                          <span className="text-blue-400 font-semibold">
                            {unreadCount}
                          </span>
                        )}
                        <span className="text-white font-semibold">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 通知設定へのリンク */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <h3 className="text-lg font-semibold mb-3">通知設定</h3>
              <p className="text-gray-300 text-sm mb-4">
                通知の種類や頻度を設定できます。
              </p>
              <Link
                href="/settings"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors block text-center"
              >
                設定を開く
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
