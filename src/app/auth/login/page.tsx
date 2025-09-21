'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SignInData } from '@/types'
import { supabase } from '@/utils/supabase/client'
import { Eye, EyeOff, Mail, Lock, Sparkles, Home } from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState<SignInData>({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()

  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(formData)
    if (error) setError(error.message)
    else router.push('/')
    setLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'twitter') => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        }
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (e: any) {
      setError(e?.message ?? `${provider} ログインでエラーが発生しました`)
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof SignInData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Twitter ロゴ SVG
  const TwitterIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  )

  // Google ロゴ SVG
  const GoogleIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 py-8">
      {/* ホームに戻るボタン */}
      <div className="absolute top-4 left-4 z-10">
        <Link 
          href="/"
          className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800/70 text-white rounded-lg transition-all duration-300 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/70"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">ホーム</span>
        </Link>
      </div>

      {/* 背景エフェクト - モバイル対応 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-48 h-48 sm:w-72 sm:h-72 bg-gray-800/30 rounded-full filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-48 h-48 sm:w-72 sm:h-72 bg-gray-700/30 rounded-full filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-48 h-48 sm:w-72 sm:h-72 bg-gray-900/30 rounded-full filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* 星の装飾 - モバイル対応 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/30 rounded-full opacity-40 animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/35 rounded-full opacity-50 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-white/25 rounded-full opacity-30 animate-pulse animation-delay-3000"></div>
      </div>

      <div className="relative w-full max-w-md mx-auto">
        {/* メインカード - モバイル最適化 */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">
          {/* ヘッダー - モバイル最適化 */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg sm:rounded-xl mb-2 sm:mb-3 shadow-lg">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Tikuru24
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">アカウントにログイン</p>
          </div>

          {/* OAuth ボタン - モバイル最適化 */}
          <div className="space-y-2 mb-3 sm:mb-4">
            <button
              type="button"
              onClick={() => handleOAuth('twitter')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-gray-800/50 hover:bg-gray-800/70 text-white py-2.5 sm:py-3 rounded-lg font-medium sm:font-semibold transition-all duration-300 border border-gray-600/50 hover:border-gray-500/70 transform hover:scale-[1.02] disabled:opacity-60 disabled:transform-none text-xs sm:text-sm"
            >
              <TwitterIcon />
              <span>Twitter でログイン</span>
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white hover:bg-gray-100 text-black py-2.5 sm:py-3 rounded-lg font-medium sm:font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 disabled:transform-none text-xs sm:text-sm"
            >
              <GoogleIcon />
              <span>Google でログイン</span>
            </button>
          </div>

          {/* 区切り線 */}
          <div className="flex items-center gap-3 sm:gap-4 my-3 sm:my-4">
            <span className="flex-1 h-px bg-gray-700/50" />
            <span className="text-gray-500 text-xs font-medium">または</span>
            <span className="flex-1 h-px bg-gray-700/50" />
          </div>

          {/* ログインフォーム */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-3 py-2 rounded-lg backdrop-blur-sm animate-shake text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                  {error}
                </div>
              </div>
            )}

            {/* メールアドレスフィールド */}
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-300">
                メールアドレス
              </label>
              <div className="relative group">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                  focusedField === 'email' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:bg-gray-800/70 transition-all duration-300 text-xs sm:text-sm"
                  placeholder="メールアドレスを入力"
                  required
                />
              </div>
            </div>

            {/* パスワードフィールド */}
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-300">
                パスワード
              </label>
              <div className="relative group">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                  focusedField === 'password' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:bg-gray-800/70 transition-all duration-300 text-xs sm:text-sm"
                  placeholder="パスワードを入力"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white py-2.5 sm:py-3 rounded-lg font-medium sm:font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:transform-none text-xs sm:text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ログイン中...
                </div>
              ) : (
                'ログイン'
              )}
            </button>
          </form>

          {/* 新規登録リンク */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-400 text-xs sm:text-sm">
              アカウントをお持ちでない方は{' '}
              <Link 
                href="/auth/signup" 
                className="text-gray-300 hover:text-white font-semibold transition-colors hover:underline"
              >
                新規登録
              </Link>
            </p>
          </div>

          {/* パスワードリセットリンク */}
          <div className="mt-2 sm:mt-3 text-center">
            <Link 
              href="/auth/reset-password" 
              className="text-gray-500 hover:text-gray-400 text-xs transition-colors hover:underline"
            >
              パスワードをお忘れですか？
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
