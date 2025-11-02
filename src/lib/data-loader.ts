import { readFileSync } from 'fs';
import path from 'path';

// Type definitions
export interface Product {
  id: string;
  name: string;
  category: string;
  isBestSeller?: number;
  isNewArrival?: number;
  price: string;
  description: string;
  images: string[];
  stock: number;
  material?: string;
  slug?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  pinCode: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
  }>;
  subtotal: string;
  shipping: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  paymentId?: string;
  orderId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  // add other properties as needed
}

// Data cache
let dataCache: {
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: User[];
} | null = null;

// Function to get data directory path
function getDataPath(): string {
  // In Next.js, we'll use the project root data directory
  return path.join(process.cwd(), 'data');
}

// Function to load data
export function loadData() {
  if (dataCache) {
    return dataCache;
  }

  console.log('Loading data...');
  
  const dataPath = getDataPath();
  console.log('Data path:', dataPath);

  const products: Product[] = [];
  const categories: Category[] = [];
  const orders: Order[] = [];
  const users: User[] = [];

  try {
    const productsData = readFileSync(path.join(dataPath, 'products.json'), 'utf-8');
    products.push(...JSON.parse(productsData));
    console.log(`Loaded ${products.length} products`);
  } catch (error) {
    console.error('Error loading products:', error);
  }

  try {
    const categoriesData = readFileSync(path.join(dataPath, 'categories.json'), 'utf-8');
    categories.push(...JSON.parse(categoriesData));
    console.log(`Loaded ${categories.length} categories`);
  } catch (error) {
    console.error('Error loading categories:', error);
  }

  try {
    const ordersData = readFileSync(path.join(dataPath, 'orders.json'), 'utf-8');
    orders.push(...JSON.parse(ordersData));
    console.log(`Loaded ${orders.length} orders`);
  } catch (error) {
    console.error('Error loading orders:', error);
  }

  try {
    const usersData = readFileSync(path.join(dataPath, 'users.json'), 'utf-8');
    users.push(...JSON.parse(usersData));
    console.log(`Loaded ${users.length} users`);
  } catch (error) {
    console.error('Error loading users:', error);
  }

  dataCache = {
    products,
    categories,
    orders,
    users
  };

  return dataCache;
}

// Function to save data
export function saveData(type: 'products' | 'categories' | 'orders' | 'users', data: any[]) {
  const dataPath = getDataPath();
  const filePath = path.join(dataPath, `${type}.json`);
  
  try {
    const jsonData = JSON.stringify(data, null, 2);
    require('fs').writeFileSync(filePath, jsonData, 'utf-8');
    
    // Update cache
    if (dataCache) {
      dataCache[type] = data;
    }
    
    console.log(`Saved ${data.length} ${type}`);
    return true;
  } catch (error) {
    console.error(`Error saving ${type}:`, error);
    return false;
  }
}
