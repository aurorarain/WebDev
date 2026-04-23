import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface LoginModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const LoginModalContext = createContext<LoginModalContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <LoginModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </LoginModalContext.Provider>
  );
}

export const useLoginModal = () => useContext(LoginModalContext);
