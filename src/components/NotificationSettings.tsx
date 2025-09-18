"use client";

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase/client';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  mentions: boolean;
  likes: boolean;
  retweets: boolean;
  follows: boolean;
}

interface NotificationSettingsProps {
  onNotificationChange?: (key: keyof NotificationSettings, value: boolean) => void;
  initialSettings?: NotificationSettings;
}

export default function NotificationSettings({ 
  onNotificationChange,
  initialSettings 
}: NotificationSettingsProps) {
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
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    mentions: true,
    likes: true,
    retweets: false,
    follows: true,
  });

  const { user } = useAuth();

  // 初期設定の読み込み
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  // プッシュ通知の状態を外部の設定と同期
  useEffect(() => {
    if (initialSettings?.push !== undefined) {
      // 外部の設定に基づいてプッシュ通知の状態を調整
      if (initialSettings.push && !isSubscribed) {
        // 設定では有効だが、実際は購読していない場合
        console.log('Push notification should be enabled');
      } else if (!initialSettings.push && isSubscribed) {
        // 設定では無効だが、実際は購読している場合
        console.log('Push notification should be disabled');
      }
    }
  }, [initialSettings?.push, isSubscribed]);

  // 設定変更の処理
  const handleSettingChange = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (onNotificationChange) {
      onNotificationChange(key as keyof NotificationSettings, value);
    }

    // プッシュ通知の設定変更
    if (key === 'push') {
      if (value && !isSubscribed) {
        await subscribe();
      } else if (!value && isSubscribed) {
        await unsubscribe();
      }
    }
  };

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      console.log('Successfully subscribed to push notifications');
      handleSettingChange('push', true);
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      console.log('Successfully unsubscribed from push notifications');
      handleSettingChange('push', false);
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

      <p className="text-gray-300 mb-4">
        新しい投稿やメッセージ、いいねなどの通知を受け取ることができます。
      </p>

      <div className="mb-4">
        <p className="text-white font-medium mb-2">
          {isSubscribed ? '通知が有効です' : '通知が無効です'}
        </p>
        <p className="text-gray-400 text-sm">
          {permission === 'granted'
            ? 'ブラウザの通知許可が与えられています'
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
                  <span>テスト通知を送信しました</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  <span>テスト通知の送信に失敗しました</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
