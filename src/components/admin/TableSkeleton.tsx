import React from 'react';

export function TableSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%',
        animation: 'pulseSkeleton 1.8s infinite ease-in-out',
      }}
    >
      {/* Barra superior de herramientas */}
      <div
        style={{
          height: '56px',
          background: 'rgba(18, 22, 34, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          width: '100%',
        }}
      />

      {/* Selector de cursos horizontal */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'hidden' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: '140px',
              height: '60px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Tabla simulada */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ height: '14px', width: '120px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }} />
          <div style={{ height: '14px', width: '180px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }} />
          <div style={{ height: '14px', width: '100px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }} />
        </div>

        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
            }}
          >
            <div style={{ height: '28px', width: '130px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '9999px' }} />
            <div style={{ height: '16px', width: '200px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }} />
            <div style={{ height: '30px', width: '110px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '8px' }} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulseSkeleton {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

