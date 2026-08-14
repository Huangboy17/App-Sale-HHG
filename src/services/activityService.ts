import { db, KEYS } from '../lib/database';
import type { Activity } from '../lib/types';

export const activityService = {
  getAll: () => db.findAll<Activity>(KEYS.ACTIVITIES),
  getByTransactionId: (transactionId: string) => db.findAll<Activity>(KEYS.ACTIVITIES).filter(a => a.transaction_id === transactionId),
  
  create: (data: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => db.create(KEYS.ACTIVITIES, data),
  delete: (id: string) => db.delete(KEYS.ACTIVITIES, id)
};
