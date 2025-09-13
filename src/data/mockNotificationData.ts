import { Notification } from '@/types';

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    title: 'いいねを受け取りました',
    message: 'あなたの投稿にいいねが付きました',
    user_id: 'user1',
    username: 'developer',
    displayName: '開発者',
    created_at: '2024-01-15T10:30:00Z',
    read: false,
    post_id: 'post1'
  },
  {
    id: '2',
    type: 'follow',
    title: '新しいフォロワー',
    message: 'developerがあなたをフォローしました',
    user_id: 'user2',
    username: 'designer',
    displayName: 'デザイナー',
    created_at: '2024-01-15T09:15:00Z',
    read: false
  },
  {
    id: '3',
    type: 'mention',
    title: 'メンションされました',
    message: '@developer あなたの投稿についてコメントしました',
    user_id: 'user3',
    username: 'coder',
    displayName: 'コーダー',
    created_at: '2024-01-15T08:45:00Z',
    read: true,
    post_id: 'post2'
  },
  {
    id: '4',
    type: 'reply',
    title: '返信を受け取りました',
    message: 'あなたの投稿に返信がありました',
    user_id: 'user4',
    username: 'programmer',
    displayName: 'プログラマー',
    created_at: '2024-01-15T07:20:00Z',
    read: true,
    post_id: 'post3'
  },
  {
    id: '5',
    type: 'bookmark',
    title: 'ブックマークされました',
    message: 'あなたの投稿がブックマークされました',
    user_id: 'user5',
    username: 'tester',
    displayName: 'テスター',
    created_at: '2024-01-14T18:30:00Z',
    read: true,
    post_id: 'post4'
  },
  {
    id: '6',
    type: 'system',
    title: 'システム通知',
    message: 'アプリがアップデートされました。新機能をご確認ください。',
    user_id: 'system',
    username: 'system',
    displayName: 'システム',
    created_at: '2024-01-14T12:00:00Z',
    read: false,
    action_url: '/settings'
  },
  {
    id: '7',
    type: 'like',
    title: 'いいねを受け取りました',
    message: 'あなたの投稿にいいねが付きました',
    user_id: 'user6',
    username: 'frontend',
    displayName: 'フロントエンド開発者',
    created_at: '2024-01-14T10:15:00Z',
    read: true,
    post_id: 'post5'
  },
  {
    id: '8',
    type: 'follow',
    title: '新しいフォロワー',
    message: 'backendがあなたをフォローしました',
    user_id: 'user7',
    username: 'backend',
    displayName: 'バックエンド開発者',
    created_at: '2024-01-13T16:45:00Z',
    read: true
  }
];
