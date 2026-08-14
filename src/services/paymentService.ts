import { db, KEYS } from '../lib/database';
import type { Payment } from '../lib/types';

export const paymentService = {
  getAll: () => db.findAll<Payment>(KEYS.PAYMENTS),
  getByContractId: (contractId: string) => db.findAll<Payment>(KEYS.PAYMENTS).filter(p => p.contract_id === contractId),
  
  create: (data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => db.create(KEYS.PAYMENTS, data as any),
  update: (id: string, data: Partial<Payment>) => db.update(KEYS.PAYMENTS, id, data),
  delete: (id: string) => db.delete(KEYS.PAYMENTS, id)
};
