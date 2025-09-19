import { NextResponse } from 'next/server';
import { parseString } from 'xml2js';

// 記事の型定義
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl: string | null;
}

// 日本のニュースサイトのRSSフィード（確実にアクセス可能なもの）
const RSS_FEEDS = [
  {
    url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
    source: 'NHK'
  },
  {
    url: 'https://www3.nhk.or.jp/rss/news/cat1.xml',
    source: 'NHK（社会）'
  },
  {
    url: 'https://www3.nhk.or.jp/rss/news/cat2.xml',
    source: 'NHK（政治）'
  },
  {
    url: 'https://www3.nhk.or.jp/rss/news/cat3.xml',
    source: 'NHK（経済）'
  },
  {
    url: 'https://www3.nhk.or.jp/rss/news/cat4.xml',
    source: 'NHK（国際）'
  }
];

// RSSフィードをパースする関数
async function parseRSSFeed(feedUrl: string, sourceName: string): Promise<NewsArticle[]> {
  try {
    console.log(`RSSフィードを取得中: ${sourceName} (${feedUrl})`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒でタイムアウト
    
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    if (!xmlText || xmlText.trim().length === 0) {
      console.warn(`${sourceName}: 空のレスポンスを受信`);
      return [];
    }
    
    return new Promise<NewsArticle[]>((resolve, reject) => {
      parseString(xmlText, (err, result) => {
        if (err) {
          console.error(`XML parse error for ${sourceName}:`, err.message);
          resolve([]);
          return;
        }
        
        try {
          const items: NewsArticle[] = [];
          
          // RSS 2.0形式の場合
          if (result.rss && result.rss.channel && result.rss.channel[0].item) {
            const rssItems = result.rss.channel[0].item.slice(0, 2); // 各カテゴリから2件まで
            
            for (const item of rssItems) {
              try {
                if (item.title && item.title[0] && item.link && item.link[0]) {
                  items.push({
                    title: item.title[0],
                    description: item.description ? item.description[0] : '',
                    url: item.link[0],
                    publishedAt: item.pubDate ? item.pubDate[0] : new Date().toISOString(),
                    source: sourceName,
                    imageUrl: item['media:content'] ? item['media:content'][0].$.url : null
                  });
                }
              } catch (itemErr) {
                console.warn(`${sourceName}: アイテム処理エラー:`, itemErr);
                continue;
              }
            }
          }
          
          console.log(`${sourceName}から${items.length}件の記事を取得しました`);
          resolve(items);
          
        } catch (parseErr) {
          console.error(`${sourceName}: パース処理エラー:`, parseErr);
          resolve([]);
        }
      });
    });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`${sourceName}: タイムアウト (${feedUrl})`);
      } else if (error.message.includes('ENOTFOUND')) {
        console.warn(`${sourceName}: DNS解決失敗 (${feedUrl})`);
      } else if (error.message.includes('TLS')) {
        console.warn(`${sourceName}: TLS接続エラー (${feedUrl})`);
      } else {
        console.warn(`${sourceName}: ネットワークエラー: ${error.message}`);
      }
    } else {
      console.warn(`${sourceName}: 不明なエラー`);
    }
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    console.log('日本のニュースを取得中...', forceRefresh ? '(強制更新)' : '');
    
    // 複数のRSSフィードから並行して記事を取得
    const feedPromises = RSS_FEEDS.map(feed => 
      parseRSSFeed(feed.url, feed.source)
    );
    
    const results = await Promise.allSettled(feedPromises);
    
    // 成功した結果をまとめる
    const allArticles: NewsArticle[] = [];
    let successCount = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allArticles.push(...result.value);
        successCount++;
      } else {
        console.warn(`${RSS_FEEDS[index].source}: 記事取得失敗または0件`);
      }
    });
    
    // 記事を日付順でソート（新しい順）
    allArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt);
      const dateB = new Date(b.publishedAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`成功: ${successCount}/${RSS_FEEDS.length}フィード, 合計${allArticles.length}件の記事を取得`);
    
    // 記事が0件の場合はモックデータを返す
    if (allArticles.length === 0) {
      console.log('記事が0件のため、モックデータを返します');
      const mockResponse = NextResponse.json({
        articles: [
          {
            title: "ポケモンSV、色違いコライドンとミライドンの限定配布がスタート",
            description: "人気ゲームソフト『ポケットモンスター スカーレット・バイオレット』で、色違いの伝説のポケモンが限定配布されるイベントが開始されました。",
            url: "https://example.com/pokemon-news",
            publishedAt: new Date().toISOString(),
            source: "ゲームニュース",
            imageUrl: null
          },
          {
            title: "夜勤事件、実写映画化!永江二朗監督が恐怖を拡大",
            description: "人気ホラーゲーム『夜勤事件』の実写映画化が決定。永江二朗監督が手がける本作は、ゲームの恐怖を忠実に再現すると話題になっています。",
            url: "https://example.com/horror-movie",
            publishedAt: new Date().toISOString(),
            source: "映画ニュース",
            imageUrl: null
          },
          {
            title: "でんぢゃらすじーさん、24年の伝説に終止符か?ファンの複雑な想い",
            description: "長年愛され続けてきた『でんぢゃらすじーさん』シリーズの終了が発表され、ファンからは複雑な声が寄せられています。",
            url: "https://example.com/denjara-news",
            publishedAt: new Date().toISOString(),
            source: "エンタメニュース",
            imageUrl: null
          },
          {
            title: "日本の経済指標、好調な回復基調を維持",
            description: "最新の経済統計によると、日本の経済は堅調な回復基調を維持しており、個人消費の回復が特に顕著です。",
            url: "https://example.com/economy-news",
            publishedAt: new Date().toISOString(),
            source: "経済ニュース",
            imageUrl: null
          },
          {
            title: "新技術開発で日本の競争力向上に期待",
            description: "国内企業による新技術の開発が進み、日本の国際競争力向上への期待が高まっています。",
            url: "https://example.com/tech-news",
            publishedAt: new Date().toISOString(),
            source: "技術ニュース",
            imageUrl: null
          },
        ],
        lastUpdated: new Date().toISOString()
      });
      
      mockResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      mockResponse.headers.set('Pragma', 'no-cache');
      mockResponse.headers.set('Expires', '0');
      return mockResponse;
    }
    
    // 最大10件を返す
    const response = NextResponse.json({ 
      articles: allArticles.slice(0, 10),
      lastUpdated: new Date().toISOString()
    });
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-News-Count', allArticles.length.toString());
    
    return response;

  } catch (error) {
    console.error('News API error:', error);
    
    // エラー時はモックデータを返す
    const errorResponse = NextResponse.json({
      articles: [
        {
          title: "ポケモンSV、色違いコライドンとミライドンの限定配布がスタート",
          description: "人気ゲームソフト『ポケットモンスター スカーレット・バイオレット』で、色違いの伝説のポケモンが限定配布されるイベントが開始されました。",
          url: "#",
          publishedAt: new Date().toISOString(),
          source: "ゲームニュース",
          imageUrl: null
        },
        {
          title: "夜勤事件、実写映画化!永江二朗監督が恐怖を拡大",
          description: "人気ホラーゲーム『夜勤事件』の実写映画化が決定。永江二朗監督が手がける本作は、ゲームの恐怖を忠実に再現すると話題になっています。",
          url: "#",
          publishedAt: new Date().toISOString(),
          source: "映画ニュース",
          imageUrl: null
        },
        {
          title: "でんぢゃらすじーさん、24年の伝説に終止符か?ファンの複雑な想い",
          description: "長年愛され続けてきた『でんぢゃらすじーさん』シリーズの終了が発表され、ファンからは複雑な声が寄せられています。",
          url: "#",
          publishedAt: new Date().toISOString(),
          source: "エンタメニュース",
          imageUrl: null
        },
      ],
      lastUpdated: new Date().toISOString()
    });
    
    errorResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    errorResponse.headers.set('Pragma', 'no-cache');
    errorResponse.headers.set('Expires', '0');
    return errorResponse;
  }
}
