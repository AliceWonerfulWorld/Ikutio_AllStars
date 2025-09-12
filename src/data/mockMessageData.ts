import { Message } from '@/types'

export const mockMessages: Message[] = [
  {
    id: '1',
    text: 'おはようございます！',
    user_id: 'user1',
    username: 'user1',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    text: '新しいプロジェクトを始めました。Next.jsとSupabaseを使ってSNSアプリを作成中です。',
    user_id: 'user2',
    username: 'user2',
    created_at: '2024-01-15T09:15:00Z',
  },
  {
    id: '3',
    text: 'コーヒーを飲みながらコードを書いています。集中力が高まります。',
    user_id: 'user3',
    username: 'user3',
    created_at: '2024-01-15T08:45:00Z',
  },
  {
    id: '4',
    text: '今日学んだこと：ReactのuseEffectの依存配列について。空の配列を渡すと初回レンダリング時のみ実行される。',
    user_id: 'user4',
    username: 'user4',
    created_at: '2024-01-15T07:20:00Z',
  },
  {
    id: '5',
    text: '夕日が綺麗でした。自然の美しさに感動します。',
    user_id: 'user5',
    username: 'user5',
    created_at: '2024-01-14T18:30:00Z',
  }
]