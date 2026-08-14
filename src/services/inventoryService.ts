import { db, KEYS } from '../lib/database';
import type { Product } from '../lib/types';

export const inventoryService = {
  getProducts: () => db.findAll<Product>(KEYS.PRODUCTS),
  getProductById: (id: string) => db.findById<Product>(KEYS.PRODUCTS, id),
  
  createProduct: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => db.create(KEYS.PRODUCTS, data),
  updateProduct: (id: string, data: Partial<Product>) => db.update(KEYS.PRODUCTS, id, data),
  deleteProduct: (id: string) => db.delete(KEYS.PRODUCTS, id)
};
