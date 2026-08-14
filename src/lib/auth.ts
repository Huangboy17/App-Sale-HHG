// ============================================================
// Auth Module - Supports both Supabase Auth and localStorage
// ============================================================

import { db } from './database';
import type { User, UserRole } from './types';
import { ROLE_PERMISSIONS } from './constants';
import type { Permission } from './constants';
import { useSupabase } from './supabaseClient';
import * as supaDb from './supabaseDatabase';

const CURRENT_USER_KEY = 'smapp_current_user_id';

// Get current user (sync for localStorage, async for Supabase)
export async function getCurrentUser(): Promise<User | null> {
  if (useSupabase()) {
    return await supaDb.supabaseGetCurrentProfile();
  }
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

// Set current user (demo login for localStorage)
export function setCurrentUser(userId: string): void {
  const user = db.getUser(userId);
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }
  localStorage.setItem(CURRENT_USER_KEY, userId);
}

// Get permissions for role
export function getUserPermissions(role: UserRole): Permission {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.SALE;
}

// Check if user has a specific permission
export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  const permissions = getUserPermissions(role);
  if (!permissions) return false;
  return !!permissions[permission];
}

// Logout
export async function logout(): Promise<void> {
  if (useSupabase()) {
    await supaDb.supabaseSignOut();
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}
