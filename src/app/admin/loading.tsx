import React from 'react';

export default function AdminLoadingSkeleton() {
  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
      <div
        style={{
          height: '42px',
          width: '280px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          marginBottom: '1rem',
          animation: 'pulse 1.5s infinite ease-in-out',
        }}
      />
      <div
        style={{
          height: '20px',
          width: '420px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '6px',
          marginBottom: '2rem',
          animation: 'pulse 1.5s infinite ease-in-out',
        }}
      />
      <div
        style={{
          height: '240px',
          width: '100%',
          background: 'rgba(18, 22, 34, 0.6)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          animation: 'pulse 1.5s infinite ease-in-out',
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
