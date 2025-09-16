// スタンプ（リアクション）テーブル設計案
// テーブル名: stanp
// Discord リアクション風スタンプ機能用

// カラム例:
// id: uuid (主キー)
// post_id: uuid (対象投稿の ID)
// user_id: uuid (スタンプを押したユーザー ID)
// stanp_url: text (スタンプ画像の URL)
// created_at: timestamp (リアクション日時)

// 備考:
// - post_id, user_id, stanp_url の組み合わせでユニーク制約を推奨
// - 投稿ごと・スタンプごとに集計しやすい設計
// - 画像 URL は Supabase Storage や外部 CDN のものを想定
