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

