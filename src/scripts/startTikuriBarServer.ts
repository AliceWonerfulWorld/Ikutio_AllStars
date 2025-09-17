// 相対パスでの直接インポートに変更
import { WebSocketServer, WebSocket } from 'ws';

interface BarUser {
  id: string;
  username: string;
  role: 'bartender' | 'speaker' | 'listener';
  isMuted: boolean;
  ws: WebSocket;
}

interface BarRoom {
  id: string;
  title: string;
  users: Map<string, BarUser>;
  createdAt: number;
}

class TikuriBarWebSocketServer {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, BarRoom> = new Map();
  private userSessions: Map<WebSocket, { userId: string; barId: string }> = new Map();

  constructor() {
    console.log('TikuriBar WebSocketServer 初期化中...');
  }

  // サーバー起動
  start(port: number = 8080) {
    if (this.wss) {
      console.log('WebSocketサーバーは既に起動しています');
      return;
    }

    this.wss = new WebSocketServer({ port });
    
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('新しいクライアントが接続しました');
      
      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('メッセージ解析エラー:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log('クライアントが切断しました');
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket エラー:', error);
      });
    });

    console.log(`TikuriBar WebSocketサーバーがポート ${port} で起動しました`);
  }

  // メッセージハンドリング
  private handleMessage(ws: WebSocket, data: any) {
    console.log('受信メッセージ:', data.type);

    switch (data.type) {
      case 'join_bar':
        this.handleJoinBar(ws, data);
        break;
      case 'leave_bar':
        this.handleLeaveBar(ws, data);
        break;
      case 'create_bar':
        this.handleCreateBar(ws, data);
        break;
      case 'get_bars':
        this.handleGetBars(ws);
        break;
      case 'chat_message':
        this.handleChatMessage(ws, data);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${data.type}`);
    }
  }

  // BAR参加
  private handleJoinBar(ws: WebSocket, data: { barId: string; user: Omit<BarUser, 'ws'> }) {
    const { barId, user } = data;

    if (!this.rooms.has(barId)) {
      this.sendError(ws, 'BAR not found');
      return;
    }

    const room = this.rooms.get(barId)!;
    const barUser: BarUser = { ...user, ws };
    
    room.users.set(user.id, barUser);
    this.userSessions.set(ws, { userId: user.id, barId });

    // 参加成功を通知
    this.send(ws, {
      type: 'joined_bar',
      barId,
      users: Array.from(room.users.values()).map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        isMuted: u.isMuted
      }))
    });

    // 他のユーザーに新規参加を通知
    this.broadcastToRoom(barId, {
      type: 'user_joined',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isMuted: user.isMuted
      }
    }, ws);

    console.log(`${user.username} が BAR ${barId} に参加しました`);
  }

  // BAR作成
  private handleCreateBar(ws: WebSocket, data: { title: string; user: Omit<BarUser, 'ws'> }) {
    const barId = `bar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { title, user } = data;

    const room: BarRoom = {
      id: barId,
      title,
      users: new Map(),
      createdAt: Date.now()
    };

    // 作成者をバーテンダーとして追加
    const bartender: BarUser = { ...user, role: 'bartender', ws };
    room.users.set(user.id, bartender);
    this.rooms.set(barId, room);
    this.userSessions.set(ws, { userId: user.id, barId });

    this.send(ws, {
      type: 'bar_created',
      barId,
      title,
      role: 'bartender'
    });

    console.log(`新しいBAR "${title}" が作成されました (ID: ${barId})`);
  }

  // BAR一覧取得
  private handleGetBars(ws: WebSocket) {
    const bars = Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      title: room.title,
      userCount: room.users.size,
      createdAt: room.createdAt
    }));

    this.send(ws, {
      type: 'bars_list',
      bars
    });
  }

  // チャットメッセージ
  private handleChatMessage(ws: WebSocket, data: { message: string }) {
    const session = this.userSessions.get(ws);
    if (!session) {
      this.sendError(ws, 'Not in any BAR');
      return;
    }

    const room = this.rooms.get(session.barId);
    const user = room?.users.get(session.userId);
    
    if (!room || !user) {
      this.sendError(ws, 'Invalid session');
      return;
    }

    this.broadcastToRoom(session.barId, {
      type: 'chat_message',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      message: data.message,
      timestamp: Date.now()
    });
  }

  // BAR退出処理
  private handleLeaveBar(ws: WebSocket, data: any) {
    this.handleDisconnect(ws);
  }

  // 切断処理
  private handleDisconnect(ws: WebSocket) {
    const session = this.userSessions.get(ws);
    if (!session) return;

    const room = this.rooms.get(session.barId);
    if (room) {
      const user = room.users.get(session.userId);
      room.users.delete(session.userId);

      // 他のユーザーに退出を通知
      if (user) {
        this.broadcastToRoom(session.barId, {
          type: 'user_left',
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
      }

      // 空のBARを削除
      if (room.users.size === 0) {
        this.rooms.delete(session.barId);
        console.log(`空のBAR ${session.barId} を削除しました`);
      }
    }

    this.userSessions.delete(ws);
  }

  // ルーム内ブロードキャスト
  private broadcastToRoom(barId: string, message: any, excludeWs?: WebSocket) {
    const room = this.rooms.get(barId);
    if (!room) return;

    room.users.forEach((user) => {
      if (user.ws !== excludeWs && user.ws.readyState === WebSocket.OPEN) {
        this.send(user.ws, message);
      }
    });
  }

  // メッセージ送信
  private send(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // エラー送信
  private sendError(ws: WebSocket, error: string) {
    this.send(ws, { type: 'error', error });
  }

  // サーバー停止
  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      console.log('TikuriBar WebSocketサーバーを停止しました');
    }
  }
}

// サーバーインスタンス作成と起動
const server = new TikuriBarWebSocketServer();
server.start(8080);

// プロセス終了時にサーバーを停止
process.on('SIGINT', () => {
  console.log('\nサーバーを停止しています...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.stop();
  process.exit(0);
});

console.log('TikuriBAR WebSocketサーバーが起動しました！');
console.log('終了するには Ctrl+C を押してください');