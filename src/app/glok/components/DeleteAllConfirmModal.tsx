"use client";

import React from 'react';

interface DeleteAllConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteAllConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: DeleteAllConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      backdropFilter: 'blur(15px)',
    }}>
      <div style={{
        backgroundColor: 'rgba(15, 15, 15, 0.98)',
        border: '2px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 24,
        padding: 40,
        maxWidth: 480,
        width: '90%',
        backdropFilter: 'blur(25px)',
        boxShadow: '0 25px 80px rgba(239, 68, 68, 0.2), 0 0 0 1px rgba(239, 68, 68, 0.1)',
        animation: 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* 警告アイコン */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 32,
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            boxShadow: '0 12px 40px rgba(239, 68, 68, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
            position: 'relative',
          }}>
            ⚠️
            {/* パルス効果 */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              animation: 'pulse 2s infinite',
            }} />
          </div>
        </div>

        {/* タイトル */}
        <h2 style={{
          color: '#fff',
          fontSize: 24,
          fontWeight: 700,
          textAlign: 'center',
          margin: '0 0 16px 0',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          全削除の確認
        </h2>

        {/* メッセージ */}
        <div style={{
          textAlign: 'center',
          marginBottom: 40,
        }}>
          <p style={{
            color: '#fca5a5',
            fontSize: 16,
            margin: '0 0 12px 0',
            lineHeight: 1.6,
            fontWeight: 500,
          }}>
            すべての会話履歴を削除しますか？
          </p>
          <p style={{
            color: '#ef4444',
            fontSize: 14,
            margin: 0,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            この操作は取り消せません
          </p>
        </div>

        {/* 警告アイコンリスト */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 32,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#fca5a5',
            fontSize: 14,
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 16 }}>🗑️</span>
            <span>すべてのチャット履歴が永久に削除されます</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#fca5a5',
            fontSize: 14,
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 16 }}>⏰</span>
            <span>削除されたデータは復元できません</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#fca5a5',
            fontSize: 14,
          }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <span>設定やアカウント情報は保持されます</span>
          </div>
        </div>

        {/* ボタン */}
        <div style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '14px 28px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 14,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 600,
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              minWidth: 120,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            キャンセル
          </button>

          <button
            onClick={onConfirm}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
              border: 'none',
              borderRadius: 14,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 700,
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 25px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              minWidth: 120,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 35px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            }}
          >
            全削除
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
