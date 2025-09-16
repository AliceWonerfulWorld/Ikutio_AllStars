'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Mail, ArrowRight } from 'lucide-react'

// メインコンポーネントを分離
function VerifyContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // URLパラメータから認証状態を確認
        const type = searchParams.get('type')
        const token = searchParams.get('token')
        const email = searchParams.get('email')

        if (type === 'signup' && token) {
          // サインアップ確認の場合
          setStatus('success')
          setMessage('メールアドレスの確認が完了しました！')
        } else if (type === 'recovery' && token) {
          // パスワードリセットの場合
          setStatus('success')
          setMessage('パスワードリセットの準備が完了しました！')
        } else {
          setStatus('error')
          setMessage('認証リンクが無効または期限切れです。')
        }
      } catch (error) {
        console.error('Auth verification error:', error)
        setStatus('error')
        setMessage('認証の確認中にエラーが発生しました。')
      }
    }

    checkAuthStatus()
  }, [searchParams])

  const handleContinue = () => {
    if (status === 'success') {
      router.push('/')
    } else {
      router.push('/auth/login')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl p-8 text-center">
          {/* ロゴ */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Ikutio AllStars</h1>
            <p className="text-gray-400">ソーシャルメディアアプリ</p>
          </div>

          {/* ステータス表示 */}
          <div className="mb-8">
            {status === 'loading' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">確認中...</h2>
                  <p className="text-gray-400">メール認証を確認しています</p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-green-400">
                    ✅ 認証完了！
                  </h2>
                  <p className="text-gray-300">{message}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-red-400">
                    ❌ 認証エラー
                  </h2>
                  <p className="text-gray-300">{message}</p>
                </div>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="space-y-4">
            {status === 'success' && (
              <>
                <button
                  onClick={handleContinue}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Ikutio AllStarsを始める</span>
                  <ArrowRight size={20} />
                </button>
                <p className="text-sm text-gray-500">
                  アカウントが有効になりました。すべての機能をご利用いただけます。
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <Link
                  href="/auth/login"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors block text-center"
                >
                  ログインページに戻る
                </Link>
                <Link
                  href="/auth/signup"
                  className="w-full border border-gray-600 text-white hover:bg-gray-800 py-3 rounded-lg font-semibold transition-colors block text-center"
                >
                  新規登録をやり直す
                </Link>
              </>
            )}

            {status === 'loading' && (
              <div className="text-sm text-gray-500">
                しばらくお待ちください...
              </div>
            )}
          </div>

          {/* 追加情報 */}
          <div className="mt-8 pt-6 border-t border-gray-800">
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

// ローディングコンポーネント
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">読み込み中...</h2>
          <p className="text-gray-400">認証確認ページを準備しています</p>
        </div>
      </div>
    </div>
  )
}

// メインのページコンポーネント
export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyContent />
    </Suspense>
  )
}
