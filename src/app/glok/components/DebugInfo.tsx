'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function DebugInfo() {
  const { user, loading } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      border: '1px solid #333',
    }}>
      <div>Auth Loading: {loading ? 'true' : 'false'}</div>
      <div>User: {user ? 'logged in' : 'not logged in'}</div>
      <div>User ID: {user?.id || 'none'}</div>
    </div>
  );
}
