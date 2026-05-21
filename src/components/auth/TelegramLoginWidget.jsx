'use client';

import React, { useEffect, useRef } from 'react';

export default function TelegramLoginWidget({ onAuth }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let scriptLoaded = false;
    window.onTelegramAuth = (data) => {
      console.log('Telegram Auth Success:', data);
      // 새 OIDC 방식: { id_token, user } 형태
      onAuth(data.user || data);
    };

    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    // OIDC 방식 로그인 버튼
    const btn = document.createElement('button');
    btn.className = 'tg-login-btn';
    btn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:8px"><svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg> Sign in with Telegram</button>';
    btn.style.cssText = 'width:100%;padding:12px 20px;background:#2AABEE;color:white;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s';
    btn.onmouseover = () => btn.style.opacity = '0.9';
    btn.onmouseout = () => btn.style.opacity = '1';
    btn.onclick = () => {
      if (scriptLoaded) {
        // @ts-ignore
        window.Telegram?.Login?.auth(
          { request_access: 'write' },
          (data) => {
            if (data.error) {
              console.error('Telegram login error:', data.error);
              return;
            }
            window.onTelegramAuth(data);
          }
        );
      }
    };
    container.appendChild(btn);

    // 새 OIDC 스크립트 로드
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://oauth.telegram.org/js/telegram-login.js?5';
    script.onload = () => {
      scriptLoaded = true;
      const clientId = (import.meta.env.VITE_TELEGRAM_CLIENT_ID || '').trim();
      if (clientId) {
        // @ts-ignore
        window.Telegram?.Login?.init({ client_id: parseInt(clientId) }, (data) => {
          if (data.error) return;
          window.onTelegramAuth(data);
        });
      }
    };
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
      delete window.onTelegramAuth;
    };
  }, [onAuth]);

  return <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center' }} />;
}
