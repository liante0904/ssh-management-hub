import { useToast } from './ToastContext';

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const COLORS = {
  success: 'var(--green)',
  error: 'var(--red)',
  warning: 'var(--yellow)',
  info: 'var(--accent)',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '.5rem',
      maxWidth: '420px',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '.6rem',
            padding: '.75rem 1rem',
            background: 'var(--bg2)',
            border: `1px solid var(--border)`,
            borderLeft: `4px solid ${COLORS[t.type]}`,
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            fontSize: '.85rem',
            lineHeight: 1.5,
            pointerEvents: 'auto',
            animation: 'slideIn 0.3s ease',
            wordBreak: 'break-word',
          }}
        >
          <span style={{ flexShrink: 0, fontSize: '1rem' }}>{ICONS[t.type]}</span>
          <span style={{ flex: 1, color: 'var(--text)' }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              color: 'var(--text2)',
              cursor: 'pointer',
              fontSize: '.9rem',
              padding: '0 .25rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
