"use client";

export function TableSkeleton({ rows = 5, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <div className="skeleton skeleton-text" style={{ width: `${40 + Math.random() * 40}px` }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: c === 0 ? '20px' : `${50 + Math.random() * 60}px` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="skeleton skeleton-text" style={{ width: '140px', height: '20px', marginBottom: 16 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{
            width: `${60 + Math.random() * 30}%`,
            height: '14px',
            marginBottom: 10,
          }}
        />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="card" style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 20, height: 20, borderRadius: '50%' }} />
        <div className="skeleton skeleton-text" style={{ width: 160, height: 18 }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 'var(--radius-md)', marginBottom: 16 }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <div className="skeleton" style={{ width: 72, height: 40, borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ width: 100, height: 40, borderRadius: 'var(--radius-md)' }} />
      </div>
    </div>
  );
}

export function DetailGridSkeleton() {
  return (
    <div className="detail-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={`detail-item ${i === 4 || i === 5 ? 'full-width' : ''}`}>
          <div className="skeleton skeleton-text" style={{ width: 60, height: 12, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: '100%', height: 40, borderRadius: 'var(--radius-sm)' }} />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="page-container">
      <div className="skeleton skeleton-text" style={{ width: 180, height: 28, marginBottom: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: 350, height: 14, marginBottom: 24 }} />
      <FormSkeleton />
      <TableSkeleton rows={6} cols={7} />
    </div>
  );
}
