export interface Post {
  id: string;
  text: string;
  title: string;
  likes: number;
  tags: string[];
  user_id: string;
  username: string;
  created_at: string;
  replies: number; // number型に統一
  bookmarked?: boolean; // ← これだけ残す
  liked?: boolean;
  imageUrl?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export interface Message {
  id: string;
  text: string;
  user_id: string;
  username: string;
  created_at: string;
}

// 認証関連の型定義を追加
export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    username?: string;
    displayName?: string;
    iconUrl?: string;
  };
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// 通知関連の型定義を追加
export interface Notification {
  id: string;
  type: "like" | "follow" | "mention" | "reply" | "bookmark" | "system";
  title: string;
  message: string;
  user_id: string;
  username: string;
  displayName: string;
  avatar?: string;
  post_id?: string;
  created_at: string;
  read: boolean;
  action_url?: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  mentions: boolean;
  likes: boolean;
  follows: boolean;
  replies: boolean;
  bookmarks: boolean;
  system: boolean;
}
