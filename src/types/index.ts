export interface Post {
    id: string
    text: string
    likes: number
    tags: string[]
    user_id: string
    username: string
    created_at: string
    replies?: number
    bookmarked?: boolean
  }
  
  export interface User {
    id: string
    username: string
    displayName: string
    avatar?: string
  }

export interface Message {
    id: string
    text: string
    user_id: string
    username: string
    created_at: string
}