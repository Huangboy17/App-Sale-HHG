import { useSupabase } from '../lib/supabaseClient';
import { db, KEYS } from '../lib/database';
import type { User, AccountStatus } from '../lib/types';

export const adminService = {
  async fetchAllProfiles(): Promise<User[]> {
    if (useSupabase()) {
      const { supabase } = await import('../lib/supabaseClient');
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data as User[];
    } else {
      return db.get<User>(KEYS.USERS);
    }
  },

  async updateProfileStatus(userId: string, status: AccountStatus, extra?: { level_2_limit?: number }): Promise<void> {
    if (useSupabase()) {
      const { supabase } = await import('../lib/supabaseClient');
      const updateData: any = { status, account_status: status };
      if (extra?.level_2_limit !== undefined) {
        updateData.level_2_limit = extra.level_2_limit;
      }
      const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
      if (error) throw error;
    } else {
      const users = db.get<User>(KEYS.USERS);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].status = status;
        users[userIndex].account_status = status;
        if (extra?.level_2_limit !== undefined) {
          users[userIndex].level_2_limit = extra.level_2_limit;
        }
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
