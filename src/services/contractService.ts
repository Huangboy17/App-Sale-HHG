import { db, KEYS } from '../lib/database';
import type { Contract, ContractItem } from '../lib/types';

export const contractService = {
  getAll: () => db.findAll<Contract>(KEYS.CONTRACTS),
  getById: (id: string) => db.findById<Contract>(KEYS.CONTRACTS, id),
  getItemsByContract: (contractId: string) => db.findAll<ContractItem>(KEYS.CONTRACT_ITEMS).filter(i => i.contract_id === contractId),
  
  create: (data: Omit<Contract, 'id' | 'contract_code' | 'created_at' | 'updated_at'>) => {
    return db.create(KEYS.CONTRACTS, {
      ...data,
      contract_code: db.getNextCode('CT')
    });
  },
  createItem: (data: Omit<ContractItem, 'id' | 'created_at'>) => db.create(KEYS.CONTRACT_ITEMS, data as any),
  update: (id: string, data: Partial<Contract>) => db.update(KEYS.CONTRACTS, id, data)
};
