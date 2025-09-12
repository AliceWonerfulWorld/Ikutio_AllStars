'use client'

import { useState } from 'react'
import { ArrowLeft, User, Mail, Bell, Shield, Palette, Globe, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

// 型定義を追加
interface NotificationSettings {
  email: boolean
  push: boolean
  mentions: boolean
  likes: boolean
  retweets: boolean
  follows: boolean
}

interface PrivacySettings {
  publicProfile: boolean
  showEmail: boolean
  showBirthDate: boolean
  allowMessages: boolean
}

interface FormData {
  username: string
  displayName: string
  email: string
  bio: string
  location: string
  website: string
  birthDate: string
  language: string
  theme: string
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState<FormData>({
    username: 'current_user',
    displayName: 'ユーザー',
    email: 'user@example.com',
    bio: 'プログラミングが好きです。',
    location: '東京, 日本',
    website: 'https://example.com',
    birthDate: '1990-01-01',
    language: 'ja',
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      mentions: true,
      likes: false,
      retweets: false,
      follows: true
    },
    privacy: {
      publicProfile: true,
      showEmail: false,
      showBirthDate: false,
      allowMessages: true
    }
  })

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedInputChange = (
    section: 'notifications' | 'privacy',
    field: string,
    value: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSave = () => {
    // ここでSupabaseに保存処理を実装
    console.log('設定を保存:', formData)
    alert('設定が保存されました！')
  }

  const tabs = [
    { id: 'profile', label: 'プロフィール', icon: User },
    { id: 'account', label: 'アカウント', icon: Mail },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'privacy', label: 'プライバシー', icon: Shield },
    { id: 'appearance', label: '外観', icon: Palette },
    { id: 'language', label: '言語', icon: Globe },
    { id: 'danger', label: '危険な操作', icon: Trash2 }
  ]

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">プロフィール情報</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              表示名
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              自己紹介
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              場所
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ウェブサイト
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderAccountTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">アカウント情報</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              生年月日
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
              パスワードを変更
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">通知設定</h3>
        <div className="space-y-4">
          {Object.entries(formData.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">
                  {key === 'email' && 'メール通知'}
                  {key === 'push' && 'プッシュ通知'}
                  {key === 'mentions' && 'メンション'}
                  {key === 'likes' && 'いいね'}
                  {key === 'retweets' && 'リツイート'}
                  {key === 'follows' && 'フォロー'}
                </div>
                <div className="text-sm text-gray-400">
                  {key === 'email' && 'メールで通知を受け取る'}
                  {key === 'push' && 'ブラウザでプッシュ通知を受け取る'}
                  {key === 'mentions' && 'メンションされた時に通知'}
                  {key === 'likes' && 'いいねされた時に通知'}
                  {key === 'retweets' && 'リツイートされた時に通知'}
                  {key === 'follows' && 'フォローされた時に通知'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNestedInputChange('notifications', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">プライバシー設定</h3>
        <div className="space-y-4">
          {Object.entries(formData.privacy).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">
                  {key === 'publicProfile' && '公開プロフィール'}
                  {key === 'showEmail' && 'メールアドレスを表示'}
                  {key === 'showBirthDate' && '生年月日を表示'}
                  {key === 'allowMessages' && 'メッセージを許可'}
                </div>
                <div className="text-sm text-gray-400">
                  {key === 'publicProfile' && 'プロフィールを公開する'}
                  {key === 'showEmail' && 'プロフィールにメールアドレスを表示'}
                  {key === 'showBirthDate' && 'プロフィールに生年月日を表示'}
                  {key === 'allowMessages' && '他のユーザーからのメッセージを許可'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNestedInputChange('privacy', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">外観設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              テーマ
            </label>
            <select
              value={formData.theme}
              onChange={(e) => handleInputChange('theme', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="dark">ダーク</option>
              <option value="light">ライト</option>
              <option value="auto">自動</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLanguageTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">言語設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              表示言語
            </label>
            <select
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
              <option value="ko">한국어</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDangerTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-red-400">危険な操作</h3>
        <div className="space-y-4">
          <div className="p-4 border border-red-500 rounded-lg">
            <h4 className="font-medium text-red-400 mb-2">アカウントを削除</h4>
            <p className="text-sm text-gray-400 mb-4">
              アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消せません。
            </p>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
              アカウントを削除
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab()
      case 'account': return renderAccountTab()
      case 'notifications': return renderNotificationsTab()
      case 'privacy': return renderPrivacyTab()
      case 'appearance': return renderAppearanceTab()
      case 'language': return renderLanguageTab()
      case 'danger': return renderDangerTab()
      default: return renderProfileTab()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto flex">
        {/* サイドバー */}
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:bg-gray-800 p-2 rounded-full transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-bold">設定</h1>
            </div>
          </div>

          <div className="flex">
            {/* 設定タブ */}
            <div className="w-64 border-r border-gray-800 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-500 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <tab.icon size={20} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* 設定内容 */}
            <div className="flex-1 p-6">
              {renderTabContent()}
              
              {/* 保存ボタン */}
              <div className="mt-8 pt-6 border-t border-gray-800">
                <button
                  onClick={handleSave}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  設定を保存
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
