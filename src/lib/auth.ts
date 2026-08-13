import { db } from './database';
import type { User, UserRole } from './types';
import { ROLE_PERMISSIONS, Permission } from './constants';

const CURRENT_USER_KEY = 'smapp_current_user_id';

// Get current user from localStorage
export function getCurrentUser(): User | null {
  try {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;
    
    const user = db.getUser(userId);
    return user || null;
  } catch (error) {
    console.error('Failed to get current user', error);
    return null;
  }
}

// Set current user (demo login)
export function setCurrentUser(userId: string): void {
  const user = db.getUser(userId);
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }
  localStorage.setItem(CURRENT_USER_KEY, userId);
}

// Get permissions for current user
export function getUserPermissions(role: UserRole): Permission {
  return ROLE_PERMISSIONS[role];
}

// Check if user has a specific permission
export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  const permissions = getUserPermissions(role);
  if (!permissions) return false;
  return !!permissions[permission];
}

// Logout
export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}
