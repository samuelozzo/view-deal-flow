import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const CORRECT_PASSWORD = "contenutonondisponibile77!";
const STORAGE_KEY = "app_access_granted";

interface PasswordContextType {
  isAccessGranted: boolean;
  checkPassword: (password: string) => boolean;
  logout: () => void;
}

const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

export const PasswordProvider = ({ children }: { children: ReactNode }) => {
  const [isAccessGranted, setIsAccessGranted] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setIsAccessGranted(true);
    }
  }, []);

  const checkPassword = (password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      setIsAccessGranted(true);
      sessionStorage.setItem(STORAGE_KEY, "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAccessGranted(false);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <PasswordContext.Provider value={{ isAccessGranted, checkPassword, logout }}>
      {children}
    </PasswordContext.Provider>
  );
};

export const usePassword = () => {
  const context = useContext(PasswordContext);
  if (context === undefined) {
    throw new Error("usePassword must be used within a PasswordProvider");
  }
  return context;
};
