import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

const ToastContext = createContext();
export function useToast() { return useContext(ToastContext); }

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolveRef = useRef(null);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useMemo(() => ({
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 6000),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  }), [addToast]);

  // confirm returns a Promise that resolves to true/false
  const confirm = useCallback((message, title = '확인') => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({ message, title });
    });
  }, []);

  const closeConfirm = useCallback((result) => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
    setConfirmState(null);
  }, []);

  // prompt replacement
  const prompt = useCallback((message, defaultValue = '') => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({ message, defaultValue, title: '입력', isPrompt: true });
    });
  }, []);

  const closePrompt = useCallback((result) => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
    setConfirmState(null);
  }, []);

  const value = useMemo(() => ({
    toasts, addToast, removeToast, toast,
    confirm, closeConfirm, confirmState,
    prompt, closePrompt,
  }), [toasts, addToast, removeToast, toast, confirm, closeConfirm, confirmState, prompt, closePrompt]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}
