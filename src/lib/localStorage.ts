// src/lib/localStorage.ts
import { User, Product } from '../App';

const STORAGE_KEYS = {
  USERS: 'stockpile_users',
  PRODUCTS: 'stockpile_products',
  CURRENT_USER: 'stockpile_current_user',
};

// Initialize with default data
const initializeData = () => {
  // Check if data already exists
  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  const existingProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);

  // Initialize users if not exists
  if (!existingUsers) {
    const defaultUsers = [
      {
        id: '1',
        email: 'admin@stockpile.com',
        password: 'admin123', // In real app, this would be hashed
        role: 'admin' as const,
      },
      {
        id: '2',
        email: 'user@stockpile.com',
        password: 'user123',
        role: 'associate' as const,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  // Initialize products if not exists
  if (!existingProducts) {
    const defaultProducts: Product[] = [
      {
        id: '1',
        name: 'Hammer - Claw 16oz',
        description: 'Standard claw hammer with rubber grip',
        category: 'Tools',
        brand: 'Stanley',
        sku: 'TOO-001',
        barcode: '123456789',
        current_stock: 25,
        min_stock_level: 10,
        max_stock_level: 50,
        cost_price: 12.50,
        selling_price: 24.99,
        supplier: 'Stanley Tools Inc',
        location: 'A1-B2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Screwdriver Set',
        description: '6-piece precision screwdriver set',
        category: 'Tools',
        brand: 'Craftsman',
        sku: 'TOO-002',
        barcode: '234567890',
        current_stock: 5,
        min_stock_level: 15,
        max_stock_level: 40,
        cost_price: 8.00,
        selling_price: 15.99,
        supplier: 'Craftsman Supply',
        location: 'A1-B3',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'LED Bulb 60W',
        description: 'Energy efficient LED bulb, warm white',
        category: 'Electrical',
        brand: 'Philips',
        sku: 'ELE-001',
        barcode: '345678901',
        current_stock: 0,
        min_stock_level: 20,
        max_stock_level: 100,
        cost_price: 3.50,
        selling_price: 7.99,
        supplier: 'Philips Lighting',
        location: 'C2-D1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'PVC Pipe 2"',
        description: '2 inch PVC pipe, 10ft length',
        category: 'Plumbing',
        brand: 'Charlotte',
        sku: 'PLU-001',
        barcode: '456789012',
        current_stock: 8,
        min_stock_level: 10,
        max_stock_level: 30,
        cost_price: 15.00,
        selling_price: 28.99,
        supplier: 'Charlotte Pipe Co',
        location: 'E3-F2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'Paint Brush Set',
        description: 'Professional paint brush set, 5 pieces',
        category: 'Paint & Supplies',
        brand: 'Purdy',
        sku: 'PAI-001',
        barcode: '567890123',
        current_stock: 35,
        min_stock_level: 20,
        max_stock_level: 60,
        cost_price: 18.00,
        selling_price: 34.99,
        supplier: 'Purdy Corp',
        location: 'D2-E1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
  }
};

// Initialize on module load
initializeData();

// User management
export const authService = {
  signIn: async (email: string, password: string): Promise<{ user: User; error: string | null }> => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      const userData: User = { id: user.id, email: user.email, role: user.role };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
      return { user: userData, error: null };
    }
    
    return { user: null as any, error: 'Invalid email or password' };
  },

  signOut: async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Product management
export const productService = {
  getAll: async (): Promise<Product[]> => {
    const products = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return products ? JSON.parse(products) : [];
  },

  getById: async (id: string): Promise<Product | null> => {
    const products = await productService.getAll();
    return products.find(p => p.id === id) || null;
  },

  create: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
    const products = await productService.getAll();
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    products.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
  },

  update: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
    const products = await productService.getAll();
    const index = products.findIndex(p => p.id === id);
    
    if (index !== -1) {
      products[index] = {
        ...products[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      return products[index];
    }
    
    return null;
  },

  delete: async (id: string): Promise<boolean> => {
    const products = await productService.getAll();
    const filtered = products.filter(p => p.id !== id);
    
    if (filtered.length !== products.length) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
      return true;
    }
    
    return false;
  },
};
