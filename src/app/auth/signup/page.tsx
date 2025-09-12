'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SignUpData } from '@/types'

export default function SignUpPage() {
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    username: '',
    displayName: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // パスワードの長さチェック
    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    // ユーザー名の重複チェック（簡単なバリデーション）
    if (formData.username.length < 3) {
      setError('ユーザー名は3文字以上で入力してください')
      setLoading(false)
      return
    }

    const { error } = await signUp(formData)
    
    if (error) {
      setError(error.message)
    } else {
      router.push('/auth/verify')
    }
    
    setLoading(false)
  }

  const handleInputChange = (field: keyof SignUpData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Ikutio</h1>
            <p className="text-gray-400">アカウントを作成</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                表示名
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="表示名を入力"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ユーザー名
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="ユーザー名を入力（3文字以上）"
                minLength={3}
                required
              />
              <p className="text-xs text-gray-500 mt-1">@マークなしで入力してください</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="メールアドレスを入力"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="パスワードを入力（6文字以上）"
                minLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">6文字以上のパスワードを設定してください</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'アカウント作成中...' : 'アカウントを作成'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              すでにアカウントをお持ちの方は{' '}
              <Link href="/auth/login" className="text-blue-400 hover:underline">
                ログイン
              </Link>
            </p>
          </div>

          {/* 利用規約とプライバシーポリシー */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              アカウントを作成することで、
              <Link href="/terms" className="text-blue-400 hover:underline">利用規約</Link>
              {' '}と{' '}
              <Link href="/privacy" className="text-blue-400 hover:underline">プライバシーポリシー</Link>
              {' '}に同意したものとみなされます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
