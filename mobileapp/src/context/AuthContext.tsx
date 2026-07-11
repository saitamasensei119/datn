import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, profileApi } from "../services/api";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  avatar?: string;
  personalEmail?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const res = await profileApi.getMyProfile();
      if (res.data) {
        const { avatar, personalEmail, phoneNumber, fullName, email, role, id } = res.data;
        setUser((prev) => {
          const updated: User = prev ? {
            ...prev,
            avatar,
            personalEmail,
            phoneNumber,
            fullName: fullName || prev.fullName,
            email: email || prev.email,
          } : {
            id: id || 0,
            email: email || "",
            fullName: fullName || "",
            role: role ? (typeof role === "string" ? role.replace("ROLE_", "") : "STUDENT") : "STUDENT",
            avatar,
            personalEmail,
            phoneNumber,
          };
          AsyncStorage.setItem("user", JSON.stringify(updated)).catch(console.error);
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedToken = await AsyncStorage.getItem("token");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          refreshProfile();
        }
      } catch (error) {
        console.error("Failed to load user info:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (data: any) => {
    try {
      const response = await authApi.login(data);
      const { token, id, email, fullName, role } = response.data;
      
      const userData: User = { 
        id, 
        email, 
        fullName, 
        role: typeof role === "string" ? role.replace("ROLE_", "") : "STUDENT" 
      };
      
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      
      setUser(userData);
      refreshProfile();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
