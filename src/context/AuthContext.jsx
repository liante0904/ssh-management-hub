'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { persistAuthSession, clearAuthSession, getSession } from '../lib/authSession';
import { setToken, clearToken } from '../lib/api';

const AUTH_BASE = import.meta.env.VITE_AUTH_BASE_URL || '';

const AuthContext = createContext();
export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [authState, setAuthState] = useState('unknown');
  const [authMessage, setAuthMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const sess = getSession();
    if (sess.token) {
      setToken(sess.token);
      setTokenState(sess.token);
      setUser(sess.user);
      setAuthState('ready');
    }
    setIsInitialized(true);
  }, []);

  const applySession = (tgUser, accessToken) => {
    setToken(accessToken);
    setTokenState(accessToken);
    setUser(tgUser);
    persistAuthSession({ user: tgUser, accessToken });
  };

  const failSession = (err) => {
    clearAuthSession();
    clearToken();
    setTokenState(null);
    setAuthState(err?.status === 401 ? 'unauthorized' : 'offline');
    setAuthMessage(err?.message || '인증에 실패했습니다.');
  };

  const authenticate = async (tgUser) => {
    setAuthState('pending');
    setAuthMessage('');

    try {
      const res = await fetch(`${AUTH_BASE}/api/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw { status: res.status, message: err.detail || `인증 실패 (${res.status})` };
      }

      const data = await res.json();

      // 관리자 체크: is_admin 필드 확인
      if (!data.user?.is_admin) {
        throw { status: 403, message: '관리자 권한이 필요합니다. 승인된 관리자만 접근할 수 있습니다.' };
      }

      applySession(tgUser, data.access_token);
      setAuthState('ready');
    } catch (err) {
      console.error('Auth failed:', err);
      failSession(err);
    }
  };

  const login = (tgUser) => authenticate(tgUser);

  const logout = () => {
    clearAuthSession();
    clearToken();
    setUser(null);
    setTokenState(null);
    setAuthState('unknown');
    setAuthMessage('');
  };

  return (
    <AuthContext.Provider value={{ user, token, authState, authMessage, login, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}
