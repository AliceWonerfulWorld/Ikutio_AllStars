export interface WeatherPost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  location: string;
  weather: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  comment: string;
  imageUrl?: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  lat?: number;
  lng?: number;
  comments?: PostComment[]; // コメント配列を追加
}

export interface NewPostData {
  location: string;
  weather: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  comment: string;
}

// 投稿コメントの型定義
export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
}

export type ViewMode = "map" | "list";

export const weatherIcons = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  snowy: "❄️",
  stormy: "⛈️",
} as const;

export const weatherLabels = {
  sunny: "晴れ",
  cloudy: "曇り",
  rainy: "雨",
  snowy: "雪",
  stormy: "嵐",
} as const;

// 天気APIレスポンス用の型
export interface WeatherApiResponse {
  location: string;
  weather: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  description: string;
}
