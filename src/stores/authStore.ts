// ============================================================
// Auth Store (Zustand) - Supabase Auth & Session Management
// ============================================================

import { create } from 'zustand';
import type { User } from '../lib/types';
import type { Permission } from '../lib/constants';
import { ROLE_PERMISSIONS } from '../lib/constants';
import { logout as logoutAuth } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';
import * as supaDb from '../lib/supabaseDatabase';

interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  company_name?: string;
  company_address?: string;
  hotline?: string;
  email?: string;
  website?: string;
}

interface AuthState {
  user: User | null;
  organization: OrganizationInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  permissions: Permission | null;

  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string, role?: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirm?: boolean }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organization: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  permissions: null,

  clearError: () => set({ error: null }),

  login: async (email: string, password?: string) => {
    set({ loading: true, error: null });

    try {
      if (!email || !email.trim()) {
        const msg = 'Vui lòng nhập email đăng nhập';
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }
      if (!password) {
        const msg = 'Vui lòng nhập mật khẩu';
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }

      console.log('[Auth] Attempting signIn for:', email.trim());
      const signInResult = await supaDb.supabaseSignIn(email.trim(), password);
      console.log('[Auth] signIn success, user:', signInResult.user?.id);

      const profile = await supaDb.supabaseGetCurrentProfile();

      if (profile) {
        let org: OrganizationInfo | null = null;
        try {
          org = await supaDb.getOrganization();
        } catch (orgErr) {
          console.warn('[Auth] Could not fetch org info:', orgErr);
        }

        set({
          user: profile,
          organization: org || {
            id: profile.organization_id || 'hhg-holdings',
            name: 'HHG Holdings',
            slug: 'hhg-holdings',
          },
          isAuthenticated: true,
          permissions: ROLE_PERMISSIONS[profile.role] || ROLE_PERMISSIONS.SALE,
          loading: false,
          error: null,
        });
        return { success: true };
      } else {
        const msg = 'Không tìm thấy hồ sơ tài khoản (Profile). Vui lòng chạy lệnh cập nhật SQL trên Supabase.';
        console.error('[Auth] Profile retrieval failed for user:', signInResult.user?.id);
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      let msg = 'Đăng nhập thất bại';

      if (err.message?.includes('Invalid login credentials') || err.code === 'invalid_credentials') {
        msg = 'Email hoặc mật khẩu không chính xác';
      } else if (err.message?.includes('Email not confirmed') || err.code === 'email_not_confirmed') {
        msg = 'Email chưa được xác thực. Vui lòng mở hộp thư email để xác nhận tài khoản, hoặc tắt mục "Confirm email" trong Supabase Dashboard -> Authentication -> Providers -> Email.';
      } else if (err.message?.includes('rate limit') || err.status === 429) {
        msg = 'Đã vượt quá giới hạn yêu cầu từ Supabase. Vui lòng thử lại sau vài phút.';
      } else if (err.message) {
        msg = err.message;
      }

      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  signup: async (email: string, password: string, fullName: string, role = 'SALE') => {
    set({ loading: true, error: null });

    try {
      if (!email || !email.trim()) {
        const msg = 'Vui lòng nhập email đăng ký';
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }
      if (!password || password.length < 6) {
        const msg = 'Mật khẩu phải có ít nhất 6 ký tự';
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }
      if (!fullName || !fullName.trim()) {
        const msg = 'Vui lòng nhập họ và tên';
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }

      console.log('[Auth] Attempting signUp for:', email.trim());

      // Get default org id if available
      let orgId: string | undefined = undefined;
      try {
        const org = await supaDb.getOrganizationBySlug('hhg-holdings');
        if (org?.id) orgId = org.id;
      } catch {
        // ignore
      }

      const signUpResult = await supaDb.supabaseSignUp(email.trim(), password, fullName.trim(), orgId, role);
      console.log('[Auth] signUp response:', signUpResult);

      const authUser = signUpResult.user;
      const session = signUpResult.session;

      // Check if user identity already exists (Supabase returns user with empty identities if email already exists and confirm email is on)
      if (authUser && authUser.identities && authUser.identities.length === 0) {
        const msg = 'Email này đã được đăng ký tài khoản trước đó. Vui lòng chuyển sang tab Đăng nhập.';
        console.warn('[Auth] Email already registered (identities empty):', email);
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }

      if (!authUser) {
        const msg = 'Đăng ký thất bại: Không nhận được thông tin người dùng từ Supabase';
        console.error('[Auth] No user in signUp result');
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }

      // Case 1: Auto-confirmed & session returned
      if (session) {
        const profile = await supaDb.supabaseGetCurrentProfile();
        let org: OrganizationInfo | null = null;
        try {
          org = await supaDb.getOrganization();
        } catch {
          // ignore
        }

        set({
          user: profile,
          organization: org,
          isAuthenticated: true,
          permissions: profile ? (ROLE_PERMISSIONS[profile.role] || ROLE_PERMISSIONS.SALE) : ROLE_PERMISSIONS.SALE,
          loading: false,
          error: null,
        });
        return { success: true };
      }

      // Case 2: Email confirmation is required by Supabase
      console.log('[Auth] User created in auth.users, but requires email confirmation:', authUser.id);
      set({ loading: false, error: null });
      return {
        success: true,
        requiresEmailConfirm: true,
        error: `Đã tạo tài khoản (${email})! Supabase đang bật chế độ xác nhận Email. Vui lòng kiểm tra hộp thư email để kích hoạt tài khoản (hoặc tắt "Confirm email" trong Supabase Dashboard để đăng nhập ngay).`,
      };

    } catch (err: any) {
      console.error('[Auth] SignUp error:', err);
      let msg = 'Đăng ký thất bại';

      if (err.message?.includes('User already registered') || err.code === 'user_already_exists') {
        msg = 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập.';
      } else if (err.message?.includes('Password should be at least') || err.code === 'weak_password') {
        msg = 'Mật khẩu phải có ít nhất 6 ký tự';
      } else if (err.message?.includes('rate limit') || err.code === 'over_email_send_rate_limit' || err.status === 429) {
        msg = 'LỖI SUPABASE: Đã vượt quá giới hạn gửi email của Supabase (Rate limit 3 emails/giờ). Vui lòng vào Supabase Dashboard -> Authentication -> Providers -> Email -> TẮT "Confirm email" để đăng ký ngay lập tức không bị giới hạn!';
      } else if (err.message) {
        msg = err.message;
      }

      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  resetPasswordForEmail: async (email: string) => {
    set({ loading: true, error: null });

    try {
      if (!email || !email.trim()) {
        const msg = 'Vui lòng nhập email để đặt lại mật khẩu';
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }

      // Dynamic redirect URL based on current environment (localhost or Vercel production)
      const redirectTo = `${window.location.origin}/reset-password`;
      console.log('[Auth] Sending password reset for:', email.trim(), 'redirect to:', redirectTo);

      await supaDb.supabaseResetPasswordForEmail(email.trim(), redirectTo);
      console.log('[Auth] Password reset email request sent successfully');

      set({ loading: false, error: null });
      return { success: true };
    } catch (err: any) {
      console.error('[Auth] resetPasswordForEmail error:', err);
      let msg = 'Không thể gửi email đặt lại mật khẩu';

      if (err.message?.includes('rate limit') || err.status === 429 || err.code === 'over_email_send_rate_limit') {
        msg = 'Đã vượt quá giới hạn gửi email từ Supabase (Rate limit). Vui lòng thử lại sau ít phút hoặc cấu hình Custom SMTP.';
      } else if (err.message) {
        msg = err.message;
      }

      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ loading: true, error: null });

    try {
      if (!newPassword || newPassword.length < 6) {
        const msg = 'Mật khẩu mới phải có ít nhất 6 ký tự';
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }

      console.log('[Auth] Updating password via Supabase Auth...');
      await supaDb.supabaseUpdatePassword(newPassword);
      console.log('[Auth] Password updated successfully');

      set({ loading: false, error: null });
      return { success: true };
    } catch (err: any) {
      console.error('[Auth] updatePassword error:', err);
      let msg = 'Đổi mật khẩu thất bại';

      if (err.message?.includes('Password should be at least') || err.code === 'weak_password') {
        msg = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      } else if (err.message?.includes('Auth session missing') || err.message?.includes('jwt') || err.status === 401) {
        msg = 'Phiên khôi phục mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại liên kết mới.';
      } else if (err.message) {
        msg = err.message;
      }

      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await logoutAuth();
    } catch (err) {
      console.error('[Auth] Logout error:', err);
    }
    set({
      user: null,
      organization: null,
      isAuthenticated: false,
      permissions: null,
      loading: false,
      error: null,
    });
  },

  initialize: async () => {
    set({ loading: true });

    try {
      const session = await supaDb.supabaseGetSession();
      if (session?.user) {
        console.log('[Auth] Session restored for user:', session.user.id);
        const profile = await supaDb.supabaseGetCurrentProfile();
        if (profile) {
          let org: OrganizationInfo | null = null;
          try {
            org = await supaDb.getOrganization();
          } catch {
            // ignore
          }

          set({
            user: profile,
            organization: org || {
              id: profile.organization_id || 'hhg-holdings',
              name: 'HHG Holdings',
              slug: 'hhg-holdings',
            },
            isAuthenticated: true,
            permissions: ROLE_PERMISSIONS[profile.role] || ROLE_PERMISSIONS.SALE,
            loading: false,
          });
          return;
        }
      }
    } catch (err) {
      console.error('[Auth] Failed to restore Supabase session:', err);
    }

    set({
      user: null,
      organization: null,
      isAuthenticated: false,
      permissions: null,
      loading: false,
    });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange event:', event, session?.user?.id);
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await supaDb.supabaseGetCurrentProfile();
        if (profile) {
          let org: OrganizationInfo | null = null;
          try {
            org = await supaDb.getOrganization();
          } catch {
            // ignore
          }
          set({
            user: profile,
            organization: org || {
              id: profile.organization_id || 'hhg-holdings',
              name: 'HHG Holdings',
              slug: 'hhg-holdings',
            },
            isAuthenticated: true,
            permissions: ROLE_PERMISSIONS[profile.role] || ROLE_PERMISSIONS.SALE,
            loading: false,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        set({
          user: null,
          organization: null,
          isAuthenticated: false,
          permissions: null,
          loading: false,
        });
      }
    });
  },
}));
