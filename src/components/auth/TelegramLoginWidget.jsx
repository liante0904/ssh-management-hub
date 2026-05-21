'use client';

import React, { useEffect, useRef } from 'react';

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'ssh_management_hub_bot';

export default function TelegramLoginWidget({ onAuth }) {
  const containerRef = useRef(null);

  useEffect(() => {
    window.onTelegramAuth = (user) => {
      console.log('Telegram Auth:', user);
      onAuth(user);
    };

    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
      delete window.onTelegramAuth;
    };
  }, [onAuth]);

  return <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center' }} />;
}
