'use client';

interface StartViewProps {
  prompt: string;
  setPrompt: (v: string) => void;
  loading: boolean;
  onSend: () => void;
}

export default function StartView({
  prompt, setPrompt, loading, onSend,
}: StartViewProps) {
  return (
    <div style={{ 
      textAlign: 'center', 
      width: '100%', 
      position: 'relative', 
      zIndex: 1,
      paddingTop: 100,
    }}>
      <div style={{ marginBottom: 60 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            color: '#fff',
            textShadow: '0 0 30px rgba(255, 255, 255, 0.3)', // 白いグローに変更
            marginBottom: 20,
          }}
        >
          <span 
            aria-hidden 
            style={{ 
              display: 'inline-block', 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              border: '4px solid #333', // ダークグレーに変更
              position: 'relative',
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', // 黒ベースのグラデーション
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)', // 白いグローに変更
            }}
          >
            <span style={{ 
              position: 'absolute', 
              left: -8, 
              top: '50%', 
              width: 32, 
              height: 4, 
              background: '#fff', 
              transform: 'translateY(-50%) rotate(-25deg)',
              borderRadius: 2,
            }} />
          </span>
          Clock
        </div>
        <div style={{
          fontSize: 18,
          color: '#aaa',
          fontWeight: 300,
          letterSpacing: 1,
        }}>
          あなたのAIアシスタント
        </div>
      </div>

      <div style={{ display: 'inline-flex', gap: 12, marginBottom: 40 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="どんなことでもお尋ねください"
          style={{
            flex: 1,
            minWidth: 400,
            padding: '18px 24px',
            borderRadius: 20,
            border: '2px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            outline: 'none',
            fontSize: 16,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; // 白いボーダーに変更
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        />
        <button 
          onClick={onSend} 
          disabled={loading} 
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            border: 'none',
            background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)', // 黒ベースのグラデーション
            color: '#fff',
            cursor: 'pointer',
            fontSize: 20,
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)', // 黒いシャドウ
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
          }}
        >
          {loading ? '...' : '↑'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button style={{
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 25,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          🎨 画像を作成
        </button>
        <button style={{
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 25,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          ✏️ 画像を編集
        </button>
      </div>
    </div>
  );
}