'use client'

import { useState } from 'react'
import { Search, TrendingUp, Hash, Users, Image, Video } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState('recommended')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { id: 'recommended', label: 'おすすめ' },
    { id: 'trends', label: 'トレンド' },
    { id: 'news', label: 'ニュース' },
    { id: 'sports', label: 'スポーツ' },
    { id: 'entertainment', label: 'エンターテイメント' }
  ]

  const mockTrends = [
    {
      id: 1,
      category: 'プログラミング',
      hashtag: '#Next.js',
      tweets: '12.3K件のツイート',
      trending: true
    },
    {
      id: 2,
      category: 'テクノロジー',
      hashtag: '#Supabase',
      tweets: '8.7K件のツイート',
      trending: true
    },
    {
      id: 3,
      category: '開発',
      hashtag: '#React',
      tweets: '25.1K件のツイート',
      trending: true
    },
    {
      id: 4,
      category: 'AI',
      hashtag: '#ChatGPT',
      tweets: '18.9K件のツイート',
      trending: true
    }
  ]

  const mockNews = [
    {
      id: 1,
      title: 'メタプラネット株急落 ビットコイン戦略が市場を震撼',
      source: 'TechCrunch',
      time: '2時間前',
      category: 'ビジネス'
    },
    {
      id: 2,
      title: 'ポケモンSV、色違いコライドンとミライドンの限定配布がスタート',
      source: 'Game Watch',
      time: '4時間前',
      category: 'ゲーム'
    },
    {
      id: 3,
      title: '夜勤事件、実写映画化!永江二朗監督が恐怖を拡大',
      source: '映画.com',
      time: '6時間前',
      category: 'エンターテイメント'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex max-w-7xl mx-auto">
        {/* 左サイドバー */}
        <div className="w-64 flex-shrink-0 h-screen sticky top-0">
          <Sidebar />
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl border-r border-gray-800">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <h1 className="text-xl font-bold">話題を検索</h1>
          </div>

          {/* 検索バー */}
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Q 検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* タブ */}
          <div className="flex border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* コンテンツエリア */}
          <div className="p-4">
            {activeTab === 'recommended' && (
              <div className="space-y-6">
                {/* プロモーション */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">BORDERLANDS 4</h3>
                  <p className="text-sm opacity-90 mb-4">ボーダーランズ4本日発売 リミッター外してヒャッハーしようぜ!!</p>
                  <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">ゲーム画像</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">東京2025世界陸上</h3>
                  <p className="text-sm opacity-90">9月13日(土)開幕!</p>
                </div>

                {/* 本日のニュース */}
                <div>
                  <h2 className="text-xl font-bold mb-4">本日のニュース</h2>
                  <div className="space-y-4">
                    {mockNews.map((news) => (
                      <div key={news.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-xs">📰</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{news.title}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <span>{news.source}</span>
                              <span>·</span>
                              <span>{news.time}</span>
                              <span>·</span>
                              <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
                                {news.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">いま話題</h2>
                {mockTrends.map((trend) => (
                  <div key={trend.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">{trend.category}</div>
                        <div className="font-semibold text-lg">{trend.hashtag}</div>
                        <div className="text-sm text-gray-400">{trend.tweets}</div>
                      </div>
                      {trend.trending && (
                        <TrendingUp className="text-green-400" size={20} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'news' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">最新ニュース</h2>
                {mockNews.map((news) => (
                  <div key={news.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors">
                    <h3 className="font-semibold mb-2">{news.title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>{news.source}</span>
                      <span>·</span>
                      <span>{news.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'sports' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">スポーツ</h2>
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">⚽</div>
                  <p>スポーツ関連のコンテンツがここに表示されます</p>
                </div>
              </div>
            )}

            {activeTab === 'entertainment' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">エンターテイメント</h2>
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🎬</div>
                  <p>エンターテイメント関連のコンテンツがここに表示されます</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 右サイドバー */}
        <div className="w-80 flex-shrink-0 h-screen sticky top-0 p-4">
          {/* ライブ放送 */}
          <div className="bg-gray-800 rounded-2xl p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">Xでライブ放送する</h2>
            <div className="space-y-4">
              <div className="border border-gray-700 rounded-lg p-3 hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🔴</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">後日談というか</div>
                    <div className="text-xs text-gray-400">+26</div>
                  </div>
                </div>
              </div>
              <div className="border border-gray-700 rounded-lg p-3 hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🔴</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">桐光@FANBOXさんがホストしています</div>
                    <div className="text-xs text-gray-400">16時まで塗る塗る</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 本日のニュース */}
          <div className="bg-gray-800 rounded-2xl p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">本日のニュース</h2>
            <div className="space-y-3">
              <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                <div className="text-sm font-semibold">ポケモンSV、色違いコライドンとミライドンの限定配布がスタート</div>
              </div>
              <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                <div className="text-sm font-semibold">夜勤事件、実写映画化!永江二朗監督が恐怖を拡大</div>
              </div>
              <div className="hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                <div className="text-sm font-semibold">でんぢゃらすじーさん、24年の伝説に終止符か?ファンの複雑な想い</div>
              </div>
            </div>
          </div>

          {/* おすすめメッセージ */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">おすすめ メッセージ</h2>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">メッセージ機能は準備中です</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
