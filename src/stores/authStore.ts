import { create } from 'zustand';
import type { User } from '../lib/types';
import type { Permission } from '../lib/constants';
import { ROLE_PERMISSIONS } from '../lib/constants';
import { getCurrentUser, setCurrentUser as setCurrentUserAuth, logout as logoutAuth } from '../lib/auth';
import { db } from '../lib/database';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: Permission | null;
  login: (userId: string) => void;
  logout: () => void;
  initialize: () => void; // Load from localStorage on app start
  getAvailableUsers: () => User[];
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  permissions: null,
  login: (userId: string) => {
    setCurrentUserAuth(userId);
    const user = db.getUser(userId);
    if (user) {
      set({
        user,
        isAuthenticated: true,
        permissions: ROLE_PERMISSIONS[user.role],
      });
    }
  },
  logout: () => {
    logoutAuth();
    set({ user: null, isAuthenticated: false, permissions: null });
  },
  initialize: () => {
    const user = getCurrentUser();
    if (user) {
      set({
        user,
        isAuthenticated: true,
        permissions: ROLE_PERMISSIONS[user.role],
      });
    }
  },
  getAvailableUsers: () => db.getUsers(),
}));
