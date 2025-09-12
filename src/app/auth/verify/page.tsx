'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export default function VerifyPage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.email_confirmed_at) {
        setMessage('メールアドレスが確認されました！')
        setIsVerified(true)
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setMessage('メールアドレスの確認をお待ちください。確認メールを送信しました。')
        setIsVerified(false)
      }
      
      setLoading(false)
    }

    checkSession()
  }, [router])

  const handleResendEmail = async () => {
    setResendLoading(true)
    setResendMessage('')
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || '',
      })
      
      if (error) {
        setResendMessage('メールの再送信に失敗しました。')
      } else {
        setResendMessage('確認メールを再送信しました。')
      }
    } catch {
      setResendMessage('エラーが発生しました。')
    }
    
    setResendLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>確認中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">
            {isVerified ? '✅' : ''}
          </div>
          
          <h1 className="text-2xl font-bold mb-4">
            {isVerified ? 'メール確認完了' : 'メール確認'}
          </h1>
          
          <p className="text-gray-300 mb-6">{message}</p>
          
          {!isVerified && (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">
                  確認メールが届かない場合
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  迷惑メールフォルダも確認してください。メールが届かない場合は、下のボタンから再送信できます。
                </p>
                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  {resendLoading ? '送信中...' : '確認メールを再送信'}
                </button>
              </div>
              
              {resendMessage && (
                <div className={`px-4 py-3 rounded-lg ${
                  resendMessage.includes('失敗') || resendMessage.includes('エラー')
                    ? 'bg-red-900/20 border border-red-800 text-red-400'
                    : 'bg-green-900/20 border border-green-800 text-green-400'
                }`}>
                  {resendMessage}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ホームに戻る
            </button>
            
            {!isVerified && (
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full border border-gray-600 text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                ログインページに戻る
              </button>
            )}
          </div>
          
          {isVerified && (
            <div className="mt-4">
              <p className="text-sm text-gray-400">
                2秒後に自動的にホームページに移動します...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
