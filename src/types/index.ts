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
  bookmarked: boolean;
  imageUrl?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}
  
export interface Message {
    id: string
    text: string
    user_id: string
    username: string
    created_at: string
}

// 認証関連の型定義を追加
export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    username?: string;
    displayName?: string;
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

