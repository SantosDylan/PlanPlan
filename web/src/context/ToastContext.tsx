import { createContext, useContext, useRef, useState, type FC, type ReactNode } from 'react';
import { css } from '../../styled-system/css';

const TOAST_DURATION_MS = 2200;

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(next);
    timerRef.current = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className={css({
            position: 'fixed',
            left: '50%',
            bottom: '84px',
            transform: 'translateX(-50%)',
            bg: 'paper',
            color: 'accentText',
            fontSize: 'sm',
            fontWeight: 'semibold',
            px: '4',
            py: '2.5',
            rounded: 'full',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
            whiteSpace: 'nowrap',
            zIndex: '50',
          })}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
