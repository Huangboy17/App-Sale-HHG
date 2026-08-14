import { db, KEYS } from '../lib/database';
import type { Customer } from '../lib/types';

export const customerService = {
  getAll: () => db.findAll<Customer>(KEYS.CUSTOMERS),
  getById: (id: string) => db.findById<Customer>(KEYS.CUSTOMERS, id),
  create: (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => db.create(KEYS.CUSTOMERS, data),
  update: (id: string, data: Partial<Customer>) => db.update(KEYS.CUSTOMERS, id, data),
  delete: (id: string) => db.delete(KEYS.CUSTOMERS, id)
};
