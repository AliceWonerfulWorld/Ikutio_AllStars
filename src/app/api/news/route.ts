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

// ログレベル定義
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// ログ管理クラス
class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    this.logLevel = envLogLevel ? LogLevel[envLogLevel as keyof typeof LogLevel] ?? LogLevel.INFO : LogLevel.INFO;
    
    if (process.env.NODE_ENV === 'production' && this.logLevel > LogLevel.WARN) {
      this.logLevel = LogLevel.WARN;
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  error(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context));
    }
  }

  warn(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  info(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  debug(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }
}

// ロガーインスタンス
const logger = Logger.getInstance();

// 日本のニュースサイトのRSSフィード
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

// XMLパース結果の型定義
interface ParsedRSSItem {
  title?: string[];
  description?: string[];
  link?: string[];
  pubDate?: string[];
  'media:content'?: Array<{ $: { url: string } }>;
}

interface ParsedRSSChannel {
  item?: ParsedRSSItem[];
}

interface ParsedRSSResult {
  rss?: {
    channel?: ParsedRSSChannel[];
  };
}

// RSSアイテムをNewsArticleに変換するヘルパー関数
function convertRSSItemToArticle(item: ParsedRSSItem, sourceName: string): NewsArticle | null {
  try {
    // 必須フィールドの検証
    if (!item.title?.[0] || !item.link?.[0]) {
      return null;
    }

    return {
      title: item.title[0],
      description: item.description?.[0] || '',
      url: item.link[0],
      publishedAt: item.pubDate?.[0] || new Date().toISOString(),
      source: sourceName,
      imageUrl: item['media:content']?.[0]?.$.url || null
    };
  } catch (error) {
    logger.debug(`アイテム変換エラー`, { 
      source: sourceName, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
}

// パースされたXMLデータから記事を抽出するヘルパー関数
function extractArticlesFromParsedXML(parsedData: ParsedRSSResult, sourceName: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  
  try {
    // RSS 2.0形式のチェック
    const items = parsedData.rss?.channel?.[0]?.item;
    if (!items || !Array.isArray(items)) {
      logger.debug(`RSSアイテムが見つかりません`, { source: sourceName });
      return articles;
    }

    // 各アイテムを変換（最大2件まで）
    const limitedItems = items.slice(0, 2);
    for (const item of limitedItems) {
      const article = convertRSSItemToArticle(item, sourceName);
      if (article) {
        articles.push(article);
      }
    }

    logger.debug(`記事抽出完了`, { 
      source: sourceName, 
      extractedCount: articles.length,
      totalItems: items.length 
    });

  } catch (error) {
    logger.error(`記事抽出エラー`, { 
      source: sourceName, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }

  return articles;
}

// XMLパースを実行するヘルパー関数
function parseXMLContent(xmlText: string, sourceName: string): Promise<NewsArticle[]> {
  return new Promise((resolve) => {
    parseString(xmlText, (err, result) => {
      if (err) {
        logger.error(`XML解析エラー`, { 
          source: sourceName, 
          error: err.message 
        });
        resolve([]);
        return;
      }

      try {
        const articles = extractArticlesFromParsedXML(result, sourceName);
        resolve(articles);
      } catch (parseErr) {
        logger.error(`パース処理エラー`, { 
          source: sourceName, 
          error: parseErr instanceof Error ? parseErr.message : 'Unknown error' 
        });
        resolve([]);
      }
    });
  });
}

// RSSフィードを取得してパースする関数
async function parseRSSFeed(feedUrl: string, sourceName: string): Promise<NewsArticle[]> {
  try {
    logger.debug(`RSSフィードを取得開始`, { source: sourceName, url: feedUrl });
    
    // タイムアウト設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // RSSフィードを取得
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
    
    // レスポンス検証
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    // 空のレスポンスチェック
    if (!xmlText || xmlText.trim().length === 0) {
      logger.warn(`空のレスポンスを受信`, { source: sourceName });
      return [];
    }
    
    // XMLパース実行
    const articles = await parseXMLContent(xmlText, sourceName);
    
    logger.debug(`RSSフィード処理完了`, { 
      source: sourceName, 
      articleCount: articles.length 
    });
    
    return articles;
    
  } catch (error) {
    // エラーハンドリング
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.warn(`タイムアウト`, { source: sourceName, url: feedUrl });
      } else if (error.message.includes('ENOTFOUND')) {
        logger.warn(`DNS解決失敗`, { source: sourceName, url: feedUrl });
      } else if (error.message.includes('TLS')) {
        logger.warn(`TLS接続エラー`, { source: sourceName, url: feedUrl });
      } else {
        logger.warn(`ネットワークエラー`, { 
          source: sourceName, 
          url: feedUrl, 
          error: error.message 
        });
      }
    } else {
      logger.warn(`不明なエラー`, { source: sourceName, url: feedUrl });
    }
    
    return [];
  }
}

// モックデータ生成関数
function generateMockArticles(): NewsArticle[] {
  const baseDate = new Date().toISOString();
  
  return [
    {
      title: "ポケモンSV、色違いコライドンとミライドンの限定配布がスタート",
      description: "人気ゲームソフト『ポケットモンスター スカーレット・バイオレット』で、色違いの伝説のポケモンが限定配布されるイベントが開始されました。",
      url: "https://example.com/pokemon-news",
      publishedAt: baseDate,
      source: "ゲームニュース",
      imageUrl: null
    },
    {
      title: "夜勤事件、実写映画化!永江二朗監督が恐怖を拡大",
      description: "人気ホラーゲーム『夜勤事件』の実写映画化が決定。永江二朗監督が手がける本作は、ゲームの恐怖を忠実に再現すると話題になっています。",
      url: "https://example.com/horror-movie",
      publishedAt: baseDate,
      source: "映画ニュース",
      imageUrl: null
    },
    {
      title: "でんぢゃらすじーさん、24年の伝説に終止符か?ファンの複雑な想い",
      description: "長年愛され続けてきた『でんぢゃらすじーさん』シリーズの終了が発表され、ファンからは複雑な声が寄せられています。",
      url: "https://example.com/denjara-news",
      publishedAt: baseDate,
      source: "エンタメニュース",
      imageUrl: null
    },
    {
      title: "日本の経済指標、好調な回復基調を維持",
      description: "最新の経済統計によると、日本の経済は堅調な回復基調を維持しており、個人消費の回復が特に顕著です。",
      url: "https://example.com/economy-news",
      publishedAt: baseDate,
      source: "経済ニュース",
      imageUrl: null
    },
    {
      title: "新技術開発で日本の競争力向上に期待",
      description: "国内企業による新技術の開発が進み、日本の国際競争力向上への期待が高まっています。",
      url: "https://example.com/tech-news",
      publishedAt: baseDate,
      source: "技術ニュース",
      imageUrl: null
    }
  ];
}

// レスポンス作成ヘルパー関数
function createNewsResponse(articles: NewsArticle[], lastUpdated: string): NextResponse {
  const response = NextResponse.json({ 
    articles: articles.slice(0, 10),
    lastUpdated 
  });
  
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('X-News-Count', articles.length.toString());
  
  return response;
}

// メインのGET関数
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    logger.info(`ニュース取得開始`, { forceRefresh });
    
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
        logger.debug(`フィード取得失敗`, { source: RSS_FEEDS[index].source });
      }
    });
    
    // 記事を日付順でソート（新しい順）
    allArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt);
      const dateB = new Date(b.publishedAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    const processingTime = Date.now() - startTime;
    logger.info(`ニュース取得完了`, { 
      successFeeds: successCount, 
      totalFeeds: RSS_FEEDS.length, 
      articleCount: allArticles.length,
      processingTime: `${processingTime}ms`
    });
    
    // 記事が0件の場合はモックデータを返す
    if (allArticles.length === 0) {
      logger.warn(`記事が0件のためモックデータを返します`);
      return createNewsResponse(generateMockArticles(), new Date().toISOString());
    }
    
    return createNewsResponse(allArticles, new Date().toISOString());

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error(`ニュース取得エラー`, { 
      error: error instanceof Error ? error.message : 'Unknown error', 
      processingTime: `${processingTime}ms` 
    });
    
    // エラー時はモックデータを返す
    return createNewsResponse(generateMockArticles(), new Date().toISOString());
  }
}
