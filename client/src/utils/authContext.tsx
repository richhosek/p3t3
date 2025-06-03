import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth from './auth';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const token = auth.getToken();
    if (token && !auth.isTokenExpired(token)) {
      const profile = auth.getProfile();
      setIsAuthenticated(true);
      setUsername(profile.data.username);
    }
  }, []);

  const login = (token: string) => {
    auth.login(token);
    const profile = auth.getProfile();
    setIsAuthenticated(true);
    setUsername(profile.data.username);
  };

  const logout = () => {
    auth.logout();
    setIsAuthenticated(false);
    setUsername('');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
