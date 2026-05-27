import { useState, useEffect } from 'react';
import { useToast } from './ToastContext';

export default function ConfirmDialog() {
  const { confirmState, closeConfirm, closePrompt } = useToast();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (confirmState?.isPrompt && confirmState.defaultValue !== undefined) {
      setInputValue(confirmState.defaultValue);
    }
  }, [confirmState]);

  useEffect(() => {
    if (!confirmState) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (confirmState.isPrompt) closePrompt(null);
        else closeConfirm(false);
      }
      if (e.key === 'Enter' && confirmState.isPrompt) {
        closePrompt(inputValue);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [confirmState, inputValue, closeConfirm, closePrompt]);

  if (!confirmState) return null;

  const { message, title, isPrompt } = confirmState;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={() => isPrompt ? closePrompt(null) : closeConfirm(false)}
    >
      <div
        style={{
          background: 'var(--bg2)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem 1.75rem',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '1.05rem', marginBottom: '.75rem', fontWeight: 700 }}>{title}</h3>
        <p style={{ fontSize: '.88rem', color: 'var(--text2)', marginBottom: isPrompt ? '.75rem' : '1.25rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {message}
        </p>

        {isPrompt && (
          <input
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') closePrompt(inputValue); }}
            style={{ width: '100%', marginBottom: '1rem', fontSize: '.88rem', padding: '.55rem .7rem' }}
            placeholder="입력하세요..."
          />
        )}

        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
          {isPrompt ? (
            <>
              <button onClick={() => closePrompt(null)} style={{ fontSize: '.85rem' }}>취소</button>
              <button className="primary" onClick={() => closePrompt(inputValue)} style={{ fontSize: '.85rem' }}>확인</button>
            </>
          ) : (
            <>
              <button onClick={() => closeConfirm(false)} style={{ fontSize: '.85rem' }}>취소</button>
              <button className="danger" onClick={() => closeConfirm(true)} style={{ fontSize: '.85rem' }}>확인</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
