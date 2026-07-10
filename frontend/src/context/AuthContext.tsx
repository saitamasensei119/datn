import React, { createContext, useContext, useState, useEffect } from 'react';
import { profileApi, authApi } from '../services/api';

export interface UserSession {
  id: number;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  avatar?: string;
  fullName?: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  login: (token: string, refreshToken?: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to decode JWT token without external libraries
const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const res = await profileApi.getMyProfile();
      if (res.data) {
        setUser((prev) => prev ? { ...prev, avatar: res.data.avatar, fullName: res.data.fullName } : null);
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (storedToken) {
        const decoded = decodeToken(storedToken);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser({
            id: decoded.userId,
            email: decoded.sub,
            role: decoded.role.replace('ROLE_', '') as any,
          });
          profileApi.getMyProfile()
            .then((res) => {
              if (res.data) {
                setUser((prev) => prev ? { ...prev, avatar: res.data.avatar, fullName: res.data.fullName } : null);
              }
            })
            .catch((err) => console.error("Failed to load profile:", err))
            .finally(() => setLoading(false));
          return;
        }
      }

      // If token is expired or invalid but we have a refreshToken, try refreshing right away
      if (storedRefreshToken) {
        try {
          const res = await authApi.refresh(storedRefreshToken);
          const newAccessToken = res.data?.accessToken || res.data?.token;
          const newRefreshToken = res.data?.refreshToken;
          if (newAccessToken) {
            localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
            const decoded = decodeToken(newAccessToken);
            if (decoded) {
              setToken(newAccessToken);
              setUser({
                id: decoded.userId,
                email: decoded.sub,
                role: decoded.role.replace('ROLE_', '') as any,
              });
              const profileRes = await profileApi.getMyProfile();
              if (profileRes.data) {
                setUser((prev) => prev ? { ...prev, avatar: profileRes.data.avatar, fullName: profileRes.data.fullName } : null);
              }
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Token refresh failed during initialization:", err);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      } else {
        localStorage.removeItem('token');
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newRefreshToken?: string) => {
    localStorage.setItem('token', newToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    const decoded = decodeToken(newToken);
    if (decoded) {
      setToken(newToken);
      setUser({
        id: decoded.userId,
        email: decoded.sub,
        role: decoded.role.replace('ROLE_', '') as any,
      });
      profileApi.getMyProfile()
        .then((res) => {
          if (res.data) {
            setUser((prev) => prev ? { ...prev, avatar: res.data.avatar, fullName: res.data.fullName } : null);
          }
        })
        .catch((err) => console.error("Failed to load profile on login:", err));
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      authApi.logout(refreshToken).catch((err: any) => console.error("Logout API error:", err));
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
