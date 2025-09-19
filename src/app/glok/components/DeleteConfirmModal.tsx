"use client";

import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 32,
        maxWidth: 400,
        width: '90%',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        animation: 'modalSlideIn 0.3s ease-out',
      }}>
        {/* アイコン */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)',
          }}>
            🗑️
          </div>
        </div>

        {/* タイトル */}
        <h2 style={{
          color: '#fff',
          fontSize: 20,
          fontWeight: 600,
          textAlign: 'center',
          margin: '0 0 16px 0',
        }}>
          {title}
        </h2>

        {/* メッセージ */}
        <p style={{
          color: '#aaa',
          fontSize: 16,
          textAlign: 'center',
          margin: '0 0 32px 0',
          lineHeight: 1.5,
        }}>
          {message}
        </p>

        {/* ボタン */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              minWidth: 100,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            キャンセル
          </button>

          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              backgroundColor: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
              minWidth: 100,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.3)';
            }}
          >
            削除
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
