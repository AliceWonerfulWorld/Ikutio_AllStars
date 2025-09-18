"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase/client';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  isSubscribed: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    subscription: null,
    isSubscribed: false,
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // プッシュ通知のサポート確認
  useEffect(() => {
    const checkSupport = () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      const permission = Notification.permission;
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission,
      }));
    };

    checkSupport();
  }, []);

  // 通知許可のリクエスト
  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.log('Push notifications are not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  // VAPIDキーの取得
  const getVapidKey = async (): Promise<string> => {
    try {
      const response = await fetch('/api/vapid-public-key');
      const data = await response.json();
      return data.key;
    } catch (error) {
      console.error('Error getting VAPID key:', error);
      throw error;
    }
  };

  // プッシュ通知の購読
  const subscribe = async (): Promise<boolean> => {
    if (!state.isSupported || !user) {
      return false;
    }

    setLoading(true);
    try {
      // 通知許可の確認
      if (state.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setLoading(false);
          return false;
        }
      }

      // Service Workerの登録確認
      const registration = await navigator.serviceWorker.ready;
      
      // VAPIDキーの取得
      const vapidKey = await getVapidKey();
      const vapidKeyBytes = urlBase64ToUint8Array(vapidKey);

      // プッシュ購読
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyBytes,
      });

      // データベースに保存
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving subscription:', error);
        return false;
      }

      setState(prev => ({
        ...prev,
        subscription,
        isSubscribed: true,
      }));

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // プッシュ通知の購読解除
  const unsubscribe = async (): Promise<boolean> => {
    if (!state.subscription) {
      return false;
    }

    setLoading(true);
    try {
      // 購読解除
      await state.subscription.unsubscribe();

      // データベースから削除
      if (user) {
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting subscription:', error);
          return false;
        }
      }

      setState(prev => ({
        ...prev,
        subscription: null,
        isSubscribed: false,
      }));

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // テスト通知の送信
  const sendTestNotification = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'テスト通知',
          body: 'プッシュ通知が正常に動作しています！',
          icon: '/android-launchericon-192-192.png',
          badge: '/android-launchericon-48-48.png',
          userId: user?.id, // 現在のユーザーIDを追加
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test notification failed:', response.status, errorText);
        return false;
      }

      console.log('Test notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  };

  return {
    ...state,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// VAPIDキーをUint8Arrayに変換する関数（完全修正版）
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  
  // ArrayBufferを作成
  const buffer = new ArrayBuffer(rawData.length);
  const uint8Array = new Uint8Array(buffer);
  
  for (let i = 0; i < rawData.length; ++i) {
    uint8Array[i] = rawData.charCodeAt(i);
  }
  
  return buffer;
}
