'use client';

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { setToken } from '../../lib/api';
import TelegramLoginWidget from './TelegramLoginWidget';

export default function LoginScreen() {
  const { login, authState, authMessage } = useAuth();
  const [secret, setSecret] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackError, setFallbackError] = useState('');

  const fallbackLogin = async (e) => {
    e.preventDefault();
    setFallbackError('');
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFallbackError(err.detail || '인증 실패');
        return;
      }
      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem('mh_user', JSON.stringify({ first_name: 'Admin' }));
      window.location.reload();
    } catch (e) {
      setFallbackError(e.message);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white', textAlign: 'center', fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)', padding: '50px', borderRadius: '40px',
        border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '360px',
        backdropFilter: 'blur(10px)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{
          background: '#0ea5e9', width: '70px', height: '70px', borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.4)',
        }}>
          <ShieldCheck color="white" size={36} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: '800' }}>SSH Management Hub</h2>
        <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '0.9rem' }}>
          관리자 인증 후 접근할 수 있습니다
        </p>

        {authState === 'pending' ? (
          <p style={{ color: '#93c5fd' }}>인증 처리 중...</p>
        ) : (
          <TelegramLoginWidget onAuth={login} />
        )}

        {authMessage && (
          <p style={{ marginTop: '16px', color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.5 }}>
            {authMessage}
          </p>
        )}

        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          {!showFallback ? (
            <button
              onClick={() => setShowFallback(true)}
              style={{
                background: 'transparent', border: 'none', color: '#64748b',
                cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline'
              }}>
              비상 로그인 (Secret Key)
            </button>
          ) : (
            <form onSubmit={fallbackLogin}>
              <input
                type="password" placeholder="JWT Secret Key"
                value={secret} onChange={e => setSecret(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '10px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)',
                  color: 'white', fontSize: '0.9rem', textAlign: 'center', outline: 'none'
                }}
              />
              <button type="submit" disabled={!secret} style={{
                marginTop: '10px', width: '100%', padding: '10px', borderRadius: '10px',
                border: 'none', background: secret ? '#0ea5e9' : '#334155',
                color: 'white', fontWeight: '600', cursor: secret ? 'pointer' : 'default',
                fontSize: '0.9rem'
              }}>로그인</button>
              {fallbackError && <p style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '8px' }}>{fallbackError}</p>}
            </form>
          )}
        </div>

        <p style={{ marginTop: '16px', color: '#64748b', fontSize: '0.75rem' }}>
          관리자 승인을 받은 Telegram 계정만 접근 가능합니다
        </p>
      </div>
    </div>
  );
}
