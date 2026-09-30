import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      const profileData = await authApi.getProfile();
      setProfile(profileData);
    } catch (err) {
      console.error("Failed to load authenticated user:", err);
      authApi.logout();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const login = async (username, password) => {
    await authApi.login(username, password);
    await loadUserData();
  };

  const register = async (userData) => {
    await authApi.register(userData);
    await login(userData.username, userData.password);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updatedData) => {
    const res = await authApi.updateProfile(updatedData);
    setProfile(res);
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, updateProfile, refreshUser: loadUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
