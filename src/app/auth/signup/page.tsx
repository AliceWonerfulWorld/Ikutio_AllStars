'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { SignUpData } from '@/types'
import { supabase } from '@/utils/supabase/client'
import { Eye, EyeOff, User, Mail, Lock, Home } from 'lucide-react'

export default function SignUpPage() {
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    username: '',
    displayName: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await signUp(formData)
      if (error) {
        throw new Error(error.message)
      }
      router.push('/auth/verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : '新規登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      setError('Googleログインに失敗しました')
    }
  }

  const handleTwitterLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      setError('Twitterログインに失敗しました')
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8">
      {/* ホームに戻るボタン */}
      <Link 
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        <Home size={20} />
        <span className="text-sm">ホームに戻る</span>
      </Link>

      {/* メインコンテンツ */}
      <div className="w-full max-w-md space-y-8">
        {/* ロゴとタイトル */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Image
              src="/Tikuru24logo.png"
              alt="Tikuru24 Logo"
              width={80}
              height={80}
              className="rounded-2xl"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">新規登録</h1>
            <p className="text-gray-400">新しいアカウントを作成してください</p>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ユーザー名 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">ユーザー名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-12 pr-4 py-3 bg-gray-900/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                  focusedField === 'username' 
                    ? 'border-blue-500/50 bg-gray-800/50' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="ユーザー名を入力"
                required
              />
            </div>
          </div>

          {/* 表示名 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">表示名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                onFocus={() => setFocusedField('displayName')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-12 pr-4 py-3 bg-gray-900/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                  focusedField === 'displayName' 
                    ? 'border-blue-500/50 bg-gray-800/50' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="表示名を入力"
                required
              />
            </div>
          </div>

          {/* メールアドレス */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-12 pr-4 py-3 bg-gray-900/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                  focusedField === 'email' 
                    ? 'border-blue-500/50 bg-gray-800/50' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          {/* パスワード */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">パスワード</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-12 pr-12 py-3 bg-gray-900/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                  focusedField === 'password' 
                    ? 'border-blue-500/50 bg-gray-800/50' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="パスワードを入力"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* 新規登録ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? '新規登録中...' : '新規登録'}
          </button>
        </form>

        {/* ソーシャルログイン */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-gray-400">または</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Googleログイン */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 bg-gray-900/50 border border-gray-700 hover:border-gray-600 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでログイン
            </button>

            {/* Twitterログイン */}
            <button
              onClick={handleTwitterLogin}
              className="w-full flex items-center justify-center gap-3 py-3 bg-gray-900/50 border border-gray-700 hover:border-gray-600 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Twitterでログイン
            </button>
          </div>
        </div>

        {/* ログインリンク */}
        <div className="text-center">
          <p className="text-gray-400">
            既にアカウントをお持ちの方は{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
