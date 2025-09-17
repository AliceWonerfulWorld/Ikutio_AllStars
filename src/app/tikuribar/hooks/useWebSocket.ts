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

    const ws = new WebSocket('ws://localhost:8080');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket接続成功');
      setIsConnected(true);
      // 接続後、利用可能なBAR一覧を取得
      getBars();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('メッセージ解析エラー:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket接続が切断されました');
      setIsConnected(false);
      setCurrentBar(null);
      setUsers([]);
      setMessages([]);
    };

    ws.onerror = (error) => {
      console.error('WebSocketエラー:', error);
    };
  }, []);

  // メッセージハンドリング
  const handleMessage = useCallback((data: any) => {
    console.log('受信:', data.type, data);
    
    switch (data.type) {
      case 'joined_bar':
        setCurrentBar(data.barId);
        setUsers(data.users);
        setMessages([]);
        console.log(`BAR ${data.barId} に参加しました`);
        break;
      case 'user_joined':
        setUsers(prev => [...prev, data.user]);
        console.log(`${data.user.username} が参加しました`);
        break;
      case 'user_left':
        setUsers(prev => prev.filter(u => u.id !== data.user.id));
        console.log(`${data.user.username} が退出しました`);
        break;
      case 'chat_message':
        setMessages(prev => [...prev, data]);
        break;
      case 'bar_created':
        setCurrentBar(data.barId);
        setUsers([]);
        setMessages([]);
        console.log(`BAR "${data.title}" を作成しました`);
        break;
      case 'bars_list':
        setAvailableBars(data.bars);
        break;
      case 'error':
        console.error('サーバーエラー:', data.error);
        alert(`エラー: ${data.error}`);
        break;
    }
  }, []);

  // BAR一覧取得
  const getBars = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未接続');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'get_bars'
    }));
  }, []);

  // BAR作成
  const createBar = useCallback((title: string, username: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未接続');
      return;
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    wsRef.current.send(JSON.stringify({
      type: 'create_bar',
      title,
      user: {
        id: userId,
        username,
        role: 'bartender',
        isMuted: false
      }
    }));
  }, []);

  // BAR参加
  const joinBar = useCallback((barId: string, username: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未接続');
      return;
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    wsRef.current.send(JSON.stringify({
      type: 'join_bar',
      barId,
      user: {
        id: userId,
        username,
        role: 'listener',
        isMuted: false
      }
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
    getBars
  };
}
