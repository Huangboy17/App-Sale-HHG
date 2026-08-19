import { useSupabase } from '../lib/supabaseClient';
import { db, KEYS } from '../lib/database';
import type { User, AccountStatus } from '../lib/types';

export const adminService = {
  async fetchAllProfiles(): Promise<User[]> {
    if (useSupabase()) {
      // Not fully implemented for Supabase yet, requires admin rights
      const { supabase } = await import('../lib/supabaseClient');
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data as User[];
    } else {
      // Local DB fallback
      return db.get<User>(KEYS.USERS);
    }
  },

  async updateProfileStatus(userId: string, status: AccountStatus): Promise<void> {
    if (useSupabase()) {
      const { supabase } = await import('../lib/supabaseClient');
      const { error } = await supabase.from('users').update({ account_status: status }).eq('id', userId);
      if (error) throw error;
    } else {
      const users = db.get<User>(KEYS.USERS);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].account_status = status;
        db.set(KEYS.USERS, users);
      }
    }
  },

  async createLevel1Account(data: Partial<User>): Promise<User> {
    if (useSupabase()) {
        throw new Error("Supabase auth creation requires admin api");
    } else {
        const newUser: User = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email: data.email || '',
            full_name: data.full_name || '',
            role: 'LEVEL_1',
            is_active: true,
            account_status: 'active',
            max_members: data.max_members || 5,
            ...data
        };
        const users = db.get<User>(KEYS.USERS);
        users.push(newUser);
        db.set(KEYS.USERS, users);
        return newUser;
    }
  }
};
