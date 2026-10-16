import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, NotificationItem } from '../types';
import { translations } from '../locales/translations';
import { api } from '../services/api';
import { auth } from '../lib/firebase';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

export type AppLanguage = 'en' | 'ta';
export type AppTab = 'home' | 'file' | 'track' | 'history' | 'admin' | 'officer' | 'analytics' | 'directory';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: typeof translations.en;
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  trackId: string;
  setTrackId: (id: string) => void;
  navigateToTrack: (id: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [role, setRole] = useState<UserRole>('CITIZEN');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [trackId, setTrackId] = useState<string>('GRV-2026-00124');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast('Logged in successfully', 'success');
    } catch (error) {
      showToast('Login failed', 'error');
    }
  };

  const logout = async () => {
    await signOut(auth);
    showToast('Logged out successfully', 'success');
  };

  const t = translations[language] || translations.en;


  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const navigateToTrack = (id: string) => {
    setTrackId(id);
    setActiveTab('track');
  };

  const fetchNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [refreshKey]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await api.markNotificationRead(id).catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        role,
        setRole,
        activeTab,
        setActiveTab,
        trackId,
        setTrackId,
        navigateToTrack,
        notifications,
        unreadCount,
        markAsRead,
        refreshKey,
        triggerRefresh,
        toasts,
        showToast,
        removeToast,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
