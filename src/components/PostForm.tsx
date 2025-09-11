'use client'

import { useState } from 'react'
import { Image, Smile, Calendar, MapPin, BarChart3 } from 'lucide-react'

interface PostFormProps {
  onSubmit: (text: string, tags: string[]) => void
}

export default function PostForm({ onSubmit }: PostFormProps) {
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    
    onSubmit(text, tags)
    setText('')
    setTags([])
  }

  const extractTags = (text: string) => {
    const tagMatches = text.match(/#\w+/g)
    return tagMatches ? tagMatches.map(tag => tag.substring(1)) : []
  }

  const handleTextChange = (value: string) => {
    setText(value)
    setTags(extractTags(value))
  }

  return (
    <div className="border-b border-gray-800 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold">
            U
          </div>
          
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="今何してる？"
              className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-xl min-h-[120px]"
              rows={3}
              maxLength={280}
            />
            
            {/* タグプレビュー */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-blue-400">
                <button 
                  type="button" 
                  className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                  aria-label="画像を追加"
                >
                  <Image size={20} />
                </button>
                <button 
                  type="button" 
                  className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                  aria-label="投票を追加"
                >
                  <BarChart3 size={20} />
                </button>
                <button 
                  type="button" 
                  className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                  aria-label="絵文字を追加"
                >
                  <Smile size={20} />
                </button>
                <button 
                  type="button" 
                  className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                  aria-label="スケジュールを追加"
                >
                  <Calendar size={20} />
                </button>
                <button 
                  type="button" 
                  className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                  aria-label="場所を追加"
                >
                  <MapPin size={20} />
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {text.length}/280
                </div>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-semibold transition-colors"
                >
                  投稿
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}