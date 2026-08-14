import { db, KEYS } from '../lib/database';
import type { Transaction } from '../lib/types';

export const transactionService = {
  getAll: () => db.findAll<Transaction>(KEYS.TRANSACTIONS),
  getById: (id: string) => db.findById<Transaction>(KEYS.TRANSACTIONS, id),
  create: (data: Omit<Transaction, 'id' | 'transaction_code' | 'created_at' | 'updated_at'>) => {
    return db.create(KEYS.TRANSACTIONS, {
      ...data,
      transaction_code: db.getNextCode('TRX')
    });
  },
  update: (id: string, data: Partial<Transaction>) => db.update(KEYS.TRANSACTIONS, id, data),
  delete: (id: string) => db.delete(KEYS.TRANSACTIONS, id)
};
