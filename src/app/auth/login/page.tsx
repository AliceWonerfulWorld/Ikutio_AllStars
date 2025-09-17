'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SignInData } from '@/types'
import { supabase } from '@/utils/supabase/client'

export default function LoginPage() {
  const [formData, setFormData] = useState<SignInData>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signIn(formData)
    
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
    }
    
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      const redirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/` 
        : undefined
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            // consent prompt を強制したい場合は以下を有効化
            // prompt: 'consent'
          }
        }
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      }
      // OAuth フローでは Supabase により外部リダイレクトが発生するため、ここでの処理は基本不要
    } catch (e: any) {
      setError(e?.message ?? 'Google ログインでエラーが発生しました')
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof SignInData, value: string) => {
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
            <p className="text-gray-400">アカウントにログイン</p>
          </div>

          {/* OAuth サインイン */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-full font-semibold hover:bg-gray-100 disabled:opacity-60 transition-colors"
              aria-label="Google でログイン"
            >
              {/* Simple Google 'G' mark using emoji fallback; replace with icon if available */}
              <span className="text-xl">G</span>
              <span>Google でログイン</span>
            </button>
          </div>

          <div className="flex items-center gap-4 my-6">
            <span className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-500 text-sm">または</span>
            <span className="flex-1 h-px bg-gray-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

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
                placeholder="パスワードを入力"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              アカウントをお持ちでない方は{' '}
              <Link href="/auth/signup" className="text-blue-400 hover:underline">
                新規登録
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
