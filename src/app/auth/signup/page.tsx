'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SignUpData } from '@/types'
import { Eye, EyeOff, User, Mail, Lock, Sparkles, Home } from 'lucide-react'

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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 py-6">
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
            <p className="text-gray-400 text-xs sm:text-sm">アカウントを作成</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-3 py-2 rounded-lg backdrop-blur-sm animate-shake text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                  {error}
                </div>
              </div>
            )}

            {/* 表示名フィールド */}
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-300">
                表示名
              </label>
              <div className="relative group">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                  focusedField === 'displayName' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  onFocus={() => setFocusedField('displayName')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:bg-gray-800/70 transition-all duration-300 text-xs sm:text-sm"
                  placeholder="表示名を入力"
                  required
                />
              </div>
            </div>

            {/* ユーザー名フィールド */}
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-300">
                ユーザー名
              </label>
              <div className="relative group">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                  focusedField === 'username' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:bg-gray-800/70 transition-all duration-300 text-xs sm:text-sm"
                  placeholder="ユーザー名を入力（3文字以上）"
                  minLength={3}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                @マークなしで入力してください
              </p>
            </div>

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
                  placeholder="パスワードを入力（6文字以上）"
                  minLength={6}
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
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                6文字以上のパスワードを設定してください
              </p>
            </div>

            {/* 作成ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white py-2.5 sm:py-3 rounded-lg font-medium sm:font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:transform-none text-xs sm:text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  アカウント作成中...
                </div>
              ) : (
                'アカウントを作成'
              )}
            </button>
          </form>

          {/* ログインリンク */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-400 text-xs sm:text-sm">
              すでにアカウントをお持ちの方は{' '}
              <Link 
                href="/auth/login" 
                className="text-gray-300 hover:text-white font-semibold transition-colors hover:underline"
              >
                ログイン
              </Link>
            </p>
          </div>

          {/* 利用規約 */}
          <div className="mt-3 sm:mt-4 text-center">
            <p className="text-xs text-gray-500">
              アカウントを作成することで、
              <Link href="/terms" className="text-gray-400 hover:underline">利用規約</Link>
              {' '}と{' '}
              <Link href="/privacy" className="text-gray-400 hover:underline">プライバシーポリシー</Link>
              {' '}に同意したものとみなされます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
