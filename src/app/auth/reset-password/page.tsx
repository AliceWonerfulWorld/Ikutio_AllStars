'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, Lock, ArrowRight } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    if (type === 'recovery' && token) {
      setStatus('success')
      setMessage('新しいパスワードを設定してください')
    } else {
      setStatus('error')
      setMessage('パスワードリセットリンクが無効または期限切れです')
    }
  }, [searchParams])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      alert('パスワードが一致しません')
      return
    }

    if (newPassword.length < 6) {
      alert('パスワードは6文字以上で入力してください')
      return
    }

    setIsLoading(true)
    try {
      const token = searchParams.get('token')
      
      // Supabaseのパスワード更新
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      setMessage('パスワードが正常に更新されました！')
      
      // 3秒後にログインページにリダイレクト
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)

    } catch (error) {
      console.error('Password reset error:', error)
      alert('パスワードの更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl p-8">
          {/* ロゴ */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Ikutio AllStars</h1>
            <p className="text-gray-400">パスワードリセット</p>
          </div>

          {/* ステータス表示 */}
          <div className="text-center mb-8">
            {status === 'success' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-green-400">
                    🔑 パスワードリセット
                  </h2>
                  <p className="text-gray-300">{message}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-red-400">
                    ❌ エラー
                  </h2>
                  <p className="text-gray-300">{message}</p>
                </div>
              </div>
            )}
          </div>

          {/* パスワードリセットフォーム */}
          {status === 'success' && (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="新しいパスワードを入力"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  パスワード確認
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="パスワードを再入力"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? '更新中...' : 'パスワードを更新'}</span>
                {!isLoading && <ArrowRight size={20} />}
              </button>
            </form>
          )}

          {/* エラー時のアクション */}
          {status === 'error' && (
            <div className="space-y-4">
              <Link
                href="/auth/login"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors block text-center"
              >
                ログインページに戻る
              </Link>
              <Link
                href="/auth/forgot-password"
                className="w-full border border-gray-600 text-white hover:bg-gray-800 py-3 rounded-lg font-semibold transition-colors block text-center"
              >
                パスワードリセットを再送信
              </Link>
            </div>
          )}

          {/* 追加情報 */}
          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-500">
              何かご不明な点がございましたら、
              <Link href="/support" className="text-blue-400 hover:underline">
                サポート
              </Link>
              までお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
