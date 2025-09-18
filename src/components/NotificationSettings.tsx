"use client";

import { useState } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  const [showTestResult, setShowTestResult] = useState<boolean | null>(null);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      console.log('Successfully subscribed to push notifications');
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      console.log('Successfully unsubscribed from push notifications');
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    setShowTestResult(success);
    setTimeout(() => setShowTestResult(null), 3000);
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BellOff className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">プッシュ通知</h3>
        </div>
        <p className="text-gray-400">
          お使いのブラウザはプッシュ通知をサポートしていません。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center space-x-3 mb-4">
        {isSubscribed ? (
          <Bell className="w-6 h-6 text-green-400" />
        ) : (
          <BellOff className="w-6 h-6 text-gray-400" />
        )}
        <h3 className="text-lg font-semibold text-white">プッシュ通知</h3>
      </div>

      <div className="space-y-4">
        <p className="text-gray-400 text-sm">
          新しい投稿やメッセージ、いいねなどの通知を受け取ることができます。
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">
              {isSubscribed ? '通知が有効です' : '通知が無効です'}
            </p>
            <p className="text-gray-400 text-sm">
              {permission === 'granted' 
                ? 'ブラウザの通知許可が与えられています'
                : permission === 'denied'
                ? 'ブラウザの通知許可が拒否されています'
                : 'ブラウザの通知許可が必要です'
              }
            </p>
          </div>
          
          <button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isSubscribed
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : isSubscribed ? (
              '無効にする'
            ) : (
              '有効にする'
            )}
          </button>
        </div>

        {isSubscribed && (
          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={handleTestNotification}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200"
            >
              <Bell className="w-4 h-4" />
              <span>テスト通知を送信</span>
            </button>
            
            {showTestResult !== null && (
              <div className={`mt-2 flex items-center space-x-2 ${
                showTestResult ? 'text-green-400' : 'text-red-400'
              }`}>
                {showTestResult ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">テスト通知を送信しました</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span className="text-sm">テスト通知の送信に失敗しました</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
