import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();

// Configure CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load data
type Product = {
  id: string;
  name: string;
  category: string;
  isBestSeller?: number;
  isNewArrival?: number;
  // add other properties as needed
};

type Category = {
  id: string;
  name: string;
  // add other properties as needed
};

type Order = {
  id: string;
  // add other properties as needed
};

type User = {
  id: string;
  // add other properties as needed
};

let products: Product[] = [];
let categories: Category[] = [];
let orders: Order[] = [];
let users: User[] = [];

try {
  const productsData = readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf-8');
  products = JSON.parse(productsData);
  console.log(`Loaded ${products.length} products`);
} catch (error) {
  console.error('Error loading products:', error);
}

try {
  const categoriesData = readFileSync(path.join(__dirname, 'data', 'categories.json'), 'utf-8');
  categories = JSON.parse(categoriesData);
  console.log(`Loaded ${categories.length} categories`);
} catch (error) {
  console.error('Error loading categories:', error);
}

try {
  const ordersData = readFileSync(path.join(__dirname, 'data', 'orders.json'), 'utf-8');
  orders = JSON.parse(ordersData);
} catch (error) {
  console.error('Error loading orders:', error);
}

try {
  const usersData = readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf-8');
  users = JSON.parse(usersData);
} catch (error) {
  console.error('Error loading users:', error);
}

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    productsCount: products.length,
    categoriesCount: categories.length
  });
});

app.get('/api/products', (req, res) => {
  console.log('GET /api/products called');
  res.json(products);
});

app.get('/api/products/best-sellers', (req, res) => {
  console.log('GET /api/products/best-sellers called');
  const bestSellers = products.filter(p => p.isBestSeller === 1);
  console.log(`Found ${bestSellers.length} best sellers`);
  res.json(bestSellers);
});

app.get('/api/products/new-arrivals', (req, res) => {
  console.log('GET /api/products/new-arrivals called');
  const newArrivals = products.filter(p => p.isNewArrival === 1);
  console.log(`Found ${newArrivals.length} new arrivals`);
  res.json(newArrivals);
});

app.get('/api/products/category/:category', (req, res) => {
  const { category } = req.params;
  console.log(`GET /api/products/category/${category} called`);
  const categoryProducts = products.filter(p => p.category === category);
  console.log(`Found ${categoryProducts.length} products in category ${category}`);
  res.json(categoryProducts);
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/products/${id} called`);
  const product = products.find(p => p.id === id);
  if (!product) {
    console.log(`Product with ID ${id} not found`);
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

app.get('/api/categories', (req, res) => {
  console.log('GET /api/categories called');
  res.json(categories);
});

app.get('/api/orders', (req, res) => {
  console.log('GET /api/orders called');
  res.json(orders);
});

app.get('/api/users', (req, res) => {
  console.log('GET /api/users called');
  res.json(users);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint',
    productsCount: products.length,
    categoriesCount: categories.length,
    ordersCount: orders.length,
    usersCount: users.length,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Handle OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Export serverless handler
export const handler = serverless(app);
