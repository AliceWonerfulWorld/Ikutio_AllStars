import { Notification as NotificationType } from '@/types';
import { Heart, UserPlus, AtSign, MessageCircle, Bookmark, Bell, ArrowRight } from 'lucide-react';

interface NotificationProps {
  notification: NotificationType;
  onMarkAsRead: (id: string) => void;
}

export default function Notification({ notification, onMarkAsRead }: NotificationProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'たった今';
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-400" />;
      case 'follow':
        return <UserPlus size={20} className="text-blue-400" />;
      case 'mention':
        return <AtSign size={20} className="text-green-400" />;
      case 'reply':
        return <MessageCircle size={20} className="text-purple-400" />;
      case 'bookmark':
        return <Bookmark size={20} className="text-yellow-400" />;
      case 'system':
        return <Bell size={20} className="text-gray-400" />;
      default:
        return <Bell size={20} className="text-gray-400" />;
    }
  };

  const getAvatarLetter = (username: string) => {
    if (!username || username.length === 0) return 'U';
    return username.charAt(0).toUpperCase();
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  return (
    <div 
      className={`p-4 hover:bg-gray-900/50 transition-colors border-b border-gray-800 cursor-pointer ${
        !notification.read ? 'bg-blue-500/5' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex space-x-3">
        {/* 通知アイコン */}
        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          {/* 通知内容 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {notification.type !== 'system' && (
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {getAvatarLetter(notification.username)}
                  </div>
                )}
                <span className="font-semibold text-white text-sm">
                  {notification.displayName}
                </span>
                {notification.type !== 'system' && (
                  <span className="text-gray-500 text-sm">@{notification.username}</span>
                )}
              </div>
              
              <h3 className="text-white font-medium mb-1">{notification.title}</h3>
              <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">
                  {formatDate(notification.created_at)}
                </span>
                {notification.action_url && (
                  <ArrowRight size={16} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* 未読マーク */}
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
