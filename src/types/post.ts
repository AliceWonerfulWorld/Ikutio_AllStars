// 🚀 共通の型定義ファイル
export type ReplyType = {
  id: string;
  post_id: number;
  user_id: string;
  text: string;
  created_at: string;
  username?: string;
  user_icon_url?: string; // 🔧 アイコン情報を追加
};

export type StanpType = {
  id: string;
  post_id: number; // string → number に変更
  user_id: string;
  stanp_url: string;
};

// 🔧 統一されたPostType定義
export type PostType = {
  id: string;
  user_id: string;
  username: string;
  title: string;
  created_at: string;
  tags: string[];
  replies: number; // 🔧 リプライ数（数値）
  likes: number;
  bookmarked: boolean;
  image_url?: string;
  iconUrl?: string;
  displayName?: string;
  setID?: string;
  liked?: boolean;
  user_icon_url?: string;
  // 🚀 拡張プロパティ（オプション）
  replies_data?: ReplyType[]; // リプライデータ配列
  stamps_data?: StanpType[];  // スタンプデータ配列
  isOptimistic?: boolean;     // 🚀 楽観的更新フラグ
};

// Postコンポーネント用の型
export type PostComponentType = {
  id: string;
  user_id: string;
  username: string;
  title: string;
  created_at: string;
  tags: string[];
  replies: ReplyType[]; // 🔧 コンポーネントでは配列データ
  likes: number;
  bookmarked: boolean;
  image_url?: string;
  user_icon_url?: string;
  displayName?: string;
  setID?: string;
  stamps?: StanpType[];
  isOptimistic?: boolean; // 🚀 楽観的更新フラグ
};
