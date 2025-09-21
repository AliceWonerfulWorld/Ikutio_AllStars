"use client";

import { useRef, useState, useCallback, useEffect } from 'react';

interface BarUser {
  id: string;
  username: string;
  role: 'bartender' | 'speaker' | 'listener';
  isMuted: boolean;
}

interface ChatMessage {
  user: BarUser;
  message: string;
  timestamp: number;
}

interface BarInfo {
  id: string;
  title: string;
  userCount: number;
  createdAt: number;
  owner?: string; // オーナー名を追加
  users?: BarUser[]; // ユーザーリストを追加
  bartender?: BarUser; // バーテンダー情報を追加
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentBar, setCurrentBar] = useState<string | null>(null);
  const [users, setUsers] = useState<BarUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableBars, setAvailableBars] = useState<BarInfo[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket接続
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // 既存の接続を閉じる
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log('WebSocket接続を試行中...');

    try {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080');
      wsRef.current = ws;
      
      // グローバルに保存（音声フック用）
      (window as any).wsInstance = ws;

      ws.onopen = () => {
        console.log('WebSocket接続成功');
        setIsConnected(true);
        // 接続成功後に少し遅延してからBAR一覧を取得
        setTimeout(() => {
          getBars();
        }, 100);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('メッセージ解析エラー:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket接続が切断されました:', event.code, event.reason);
        setIsConnected(false);
        setCurrentBar(null);
        setUsers([]);
        setMessages([]);
      };

      ws.onerror = (error) => {
        console.error('WebSocketエラー:', error);
        setIsConnected(false);
        
        // エラー時は少し待ってから再試行
        setTimeout(() => {
          console.log('WebSocket再接続を試行...');
          connect();
        }, 2000);
      };

    } catch (error) {
      console.error('WebSocket作成エラー:', error);
      setIsConnected(false);
    }
  }, []);

  // バーテンダー情報を取得するヘルパー関数
  const getBartenderInfo = useCallback((bar: BarInfo): string => {
    // 1. 直接ownerフィールドがある場合
    if (bar.owner) {
      console.log('バーテンダー情報 (owner):', bar.owner);
      return bar.owner;
    }
    
    // 2. bartenderフィールドがある場合
    if (bar.bartender?.username) {
      console.log('バーテンダー情報 (bartender):', bar.bartender.username);
      return bar.bartender.username;
    }
    
    // 3. users配列からrole='bartender'のユーザーを探す
    if (bar.users && bar.users.length > 0) {
      const bartender = bar.users.find(user => user.role === 'bartender');
      if (bartender) {
        console.log('バーテンダー情報 (users配列):', bartender.username);
        return bartender.username;
      }
    }
    
    console.warn('バーテンダー情報が見つかりません:', bar);
    return '不明';
  }, []);

  // メッセージハンドリング
  const handleMessage = useCallback((data: any) => {
    console.log('受信:', data.type, data);
    
    switch (data.type) {
      case 'joined_bar':
        setCurrentBar(data.barId);
        setUsers(data.users || []);
        setMessages([]);
        console.log(`BAR ${data.barId} に参加しました`);
        break;
      case 'user_joined':
        setUsers(prev => {
          const newUsers = [...prev, data.user];
          console.log('ユーザー参加後のリスト:', newUsers);
          return newUsers;
        });
        console.log(`${data.user.username} が参加しました`);
        break;
      case 'user_left':
        setUsers(prev => {
          const newUsers = prev.filter(u => u.id !== data.user.id);
          console.log('ユーザー退出後のリスト:', newUsers);
          return newUsers;
        });
        console.log(`${data.user.username} が退出しました`);
        break;
      case 'chat_message':
        setMessages(prev => [...prev, data]);
        break;
      case 'bar_created':
        setCurrentBar(data.barId);
        setUsers(data.users || []);
        setMessages([]);
        console.log(`BAR "${data.title}" を作成しました`);
        break;
      case 'bars_list':
        console.log('受信したバーリスト:', data.bars);
        // バーリストを処理してバーテンダー情報を追加
        const processedBars = data.bars.map((bar: any) => ({
          ...bar,
          // バーテンダー情報を確実に設定
          owner: bar.owner || (bar.users?.find((u: BarUser) => u.role === 'bartender')?.username) || '不明'
        }));
        console.log('処理後のバーリスト:', processedBars);
        setAvailableBars(processedBars);
        break;
      case 'error':
        console.error('サーバーエラー:', data.error);
        alert(`エラー: ${data.error}`);
        break;
      case 'audio_chunk':
        console.log(`🎧 音声チャンク受信: ${data.username} から`);
        // スピーカーOFFの場合は音声処理をスキップ
        if ((window as any).isDeafened) {
          console.log('🔇 スピーカーOFFのため音声再生をスキップ');
          return;
        }
        // 音声フックに転送（音声フックがセットされている場合）
        if ((window as any).handleAudioChunk) {
          (window as any).handleAudioChunk(data);
        }
        break;
    }
  }, [getBartenderInfo]);

  // BAR一覧取得
  const getBars = useCallback(() => {
    if (!wsRef.current) {
      console.error('WebSocket未初期化');
      return;
    }
    
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未接続 - 状態:', wsRef.current.readyState);
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'get_bars'
      }));
      console.log('BAR一覧取得リクエスト送信');
    } catch (error) {
      console.error('BAR一覧取得エラー:', error);
    }
  }, []);

  // BAR作成
  const createBar = useCallback((title: string, username: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未接続');
      return;
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const userData = {
      id: userId,
      username,
      role: 'bartender' as const,
      isMuted: false
    };

    console.log('バー作成リクエスト:', { title, user: userData });

    wsRef.current.send(JSON.stringify({
      type: 'create_bar',
      title,
      user: userData
    }));
  }, []);

  // BAR参加
  const joinBar = useCallback((barId: string, username: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未接続');
      return;
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const userData = {
      id: userId,
      username,
      role: 'listener' as const,
      isMuted: false
    };

    console.log('バー参加リクエスト:', { barId, user: userData });

    wsRef.current.send(JSON.stringify({
      type: 'join_bar',
      barId,
      user: userData
    }));
  }, []);

  // チャットメッセージ送信
  const sendMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未接続');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      message
    }));
  }, []);

  // BAR退出
  const leaveBar = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'leave_bar'
    }));

    setCurrentBar(null);
    setUsers([]);
    setMessages([]);
  }, []);

  // 切断
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  // 自動再接続
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    if (!isConnected && wsRef.current?.readyState === WebSocket.CLOSED) {
      reconnectTimer = setTimeout(() => {
        console.log('再接続を試行しています...');
        connect();
      }, 3000);
    }

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [isConnected, connect]);

  return {
    isConnected,
    currentBar,
    users,
    messages,
    availableBars,
    connect,
    disconnect,
    createBar,
    joinBar,
    sendMessage,
    leaveBar,
    getBars,
    getBartenderInfo // バーテンダー情報取得関数をエクスポート
  };
}
