'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Settings, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Notification from '@/components/Notification';
import MobileNavigation from '@/components/MobileNavigation';
import MobileExtendedNavigation from '@/components/MobileExtendedNavigation';
import { Notification as NotificationType } from '@/types';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// 拡張された通知タイプ
interface EnhancedNotification extends NotificationType {
  user_info?: {
    username: string;
    icon_url?: string;
    setID: string;
  } | null; // null も許可
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // 未ログイン時はログイン画面にリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // フィルタリングされた通知をメモ化
  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(notification => !notification.read);
  }, [notifications, filter]);

  // 未読通知数をメモ化
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !notification.read).length;
  }, [notifications]);

  // ユーザー情報を取得する関数
  const fetchUserInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usels')
        .select('username, icon_url, setID')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user info:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  // 通知データの取得（最適化版）
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        setError(null);
        
        // 通知データを取得
        const { data: notificationsData, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching notifications:', error);
          setError('通知の取得に失敗しました');
          return;
        }

        if (!isMounted) return;

        // 各通知の送信者のユーザー情報を取得
        console.log('🔍 Notifications data:', notificationsData);
        
        const enhancedNotifications = await Promise.all(
          (notificationsData || []).map(async (notification) => {
            console.log('🔍 Processing notification:', notification);
            console.log('🔍 Notification data field:', notification.data);
            
            // dataフィールドから送信者IDを取得
            let senderUserId = null;
            if (notification.data) {
              console.log('🔍 Data type:', typeof notification.data);
              console.log('🔍 Data keys:', Object.keys(notification.data));
              
              // 送信者IDを取得
              senderUserId = notification.data.likerId;
              console.log('🔧 Using likerId:', senderUserId);
              
              if (senderUserId) {
                const userInfo = await fetchUserInfo(senderUserId);
                console.log('🔍 Retrieved user info:', userInfo);
                
                return {
                  ...notification,
                  user_info: userInfo || undefined
                };
              }
            }
            
            console.log('🔍 No sender user ID found');
            return notification;
          })
        );

        if (isMounted) {
          setNotifications(enhancedNotifications);
        }
      } catch (error) {
        console.error('Error:', error);
        setError('予期しないエラーが発生しました');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNotifications();

    // リアルタイム購読（最適化版）
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          if (isMounted) {
            console.log('New notification received:', payload);
            
            // 新しい通知のユーザー情報を取得
            let enhancedNotification = payload.new as EnhancedNotification;
            if (payload.new.from_user_id) {
              const userInfo = await fetchUserInfo(payload.new.from_user_id);
              enhancedNotification = {
                ...payload.new as NotificationType,
                user_info: userInfo || undefined // null を undefined に変換
              };
            }
            
            setNotifications(prev => {
              const exists = prev.some(n => n.id === payload.new.id);
              if (exists) return prev;
              return [enhancedNotification, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (isMounted) {
            setNotifications(prev =>
              prev.map(notification =>
                notification.id === payload.new.id
                  ? { ...notification, ...payload.new }
                  : notification
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 通知を既読にする関数（最適化版）
  const handleMarkAsRead = useCallback(async (id: string) => {
    if (!user) return;
    
    // 楽観的更新
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // エラー時は元に戻す
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: false }
            : notification
        )
      );
    }
  }, [user]);

  // すべての通知を既読にする関数
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user) return;

    // 楽観的更新
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // エラー時は再取得
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (data) {
        setNotifications(data);
      }
    }
  }, [user]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>通知を読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto flex h-screen">
        {/* デスクトップ: 左サイドバー */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar />
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl lg:border-r border-gray-800">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-lg lg:text-xl font-bold">通知</h1>
              </div>
              
              {/* 通知アクション */}
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    すべて既読にする
                  </button>
                )}
                <Link
                  href="/settings"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Settings size={20} />
                </Link>
              </div>
            </div>
          </div>

          {/* フィルター */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                filter === 'unread'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              未読
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* 通知一覧 */}
          <div className="divide-y divide-gray-800">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                {filter === 'unread' ? '未読の通知はありません' : '通知はありません'}
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

        {/* デスクトップ: 右サイドバー */}
        <div className="hidden xl:block w-80 flex-shrink-0 h-screen overflow-y-auto p-4">
          <div className="sticky top-4">
            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">通知設定</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">プッシュ通知</span>
                  <button className="w-11 h-6 bg-blue-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">メール通知</span>
                  <button className="w-11 h-6 bg-gray-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* モバイルナビゲーション */}
      <MobileNavigation />
      <MobileExtendedNavigation />
    </div>
  );
}
