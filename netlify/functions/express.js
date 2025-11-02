
import serverlessHttp from 'serverless-http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Function initializing, __dirname:', __dirname);

const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load data synchronously with better error handling
let products = [];
let categories = [];
let orders = [];
let users = [];

console.log('Loading data files...');

try {
  const dataPath = path.join(__dirname, 'data');
  console.log('Data directory path:', dataPath);
  
  const productsData = readFileSync(path.join(dataPath, 'products.json'), 'utf-8');
  products = JSON.parse(productsData);
  console.log('Products loaded:', products.length);
} catch (error) {
  console.error('Error loading products:', error.message);
  products = [];
}

try {
  const categoriesData = readFileSync(path.join(__dirname, 'data', 'categories.json'), 'utf-8');
  categories = JSON.parse(categoriesData);
  console.log('Categories loaded:', categories.length);
} catch (error) {
  console.error('Error loading categories:', error.message);
  categories = [];
}

try {
  const ordersData = readFileSync(path.join(__dirname, 'data', 'orders.json'), 'utf-8');
  orders = JSON.parse(ordersData);
  console.log('Orders loaded:', orders.length);
} catch (error) {
  console.error('Error loading orders:', error.message);
  orders = [];
}

try {
  const usersData = readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf-8');
  users = JSON.parse(usersData);
  console.log('Users loaded:', users.length);
} catch (error) {
  console.error('Error loading users:', error.message);
  users = [];
}

// API Routes
app.get('/api/products', (req, res) => {
  console.log('Products endpoint called');
  res.json(products);
});

app.get('/api/products/best-sellers', (req, res) => {
  console.log('Best sellers endpoint called');
  const bestSellers = products.filter(p => p.isBestSeller === 1);
  console.log('Best sellers found:', bestSellers.length);
  res.json(bestSellers);
});

app.get('/api/products/new-arrivals', (req, res) => {
  console.log('New arrivals endpoint called');
  const newArrivals = products.filter(p => p.isNewArrival === 1);
  console.log('New arrivals found:', newArrivals.length);
  res.json(newArrivals);
});

app.get('/api/products/category/:category', (req, res) => {
  const { category } = req.params;
  console.log('Category endpoint called for:', category);
  const categoryProducts = products.filter(p => p.category === category);
  console.log('Category products found:', categoryProducts.length);
  res.json(categoryProducts);
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  console.log('Product detail endpoint called for ID:', id);
  const product = products.find(p => p.id === id);
  if (!product) {
    console.log('Product not found for ID:', id);
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Handle path parameter from Netlify redirects
app.get('/', (req, res) => {
  const path = req.query.path;
  console.log('Root handler called with path:', path);
  
  if (!path) {
    return res.json({ message: 'API server running', availableEndpoints: ['/api/products', '/api/products/best-sellers', '/api/products/new-arrivals', '/api/categories'] });
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  console.log('Clean path:', cleanPath);
  
  if (cleanPath === 'api/products/best-sellers') {
    const bestSellers = products.filter(p => p.isBestSeller === 1);
    console.log('Best sellers found via path param:', bestSellers.length);
    return res.json(bestSellers);
  }
  
  if (cleanPath === 'api/products/new-arrivals') {
    const newArrivals = products.filter(p => p.isNewArrival === 1);
    console.log('New arrivals found via path param:', newArrivals.length);
    return res.json(newArrivals);
  }
  
  if (cleanPath === 'api/products') {
    console.log('Products found via path param:', products.length);
    return res.json(products);
  }
  
  if (cleanPath === 'api/categories') {
    console.log('Categories found via path param:', categories.length);
    return res.json(categories);
  }
  
  if (cleanPath.startsWith('api/products/category/')) {
    const category = cleanPath.replace('api/products/category/', '');
    const categoryProducts = products.filter(p => p.category === category);
    console.log('Category products found via path param:', categoryProducts.length, 'for category:', category);
    return res.json(categoryProducts);
  }
  
  if (cleanPath.startsWith('api/products/')) {
    const id = cleanPath.replace('api/products/', '');
    const product = products.find(p => p.id === id);
    if (!product) {
      console.log('Product not found via path param for ID:', id);
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log('Product found via path param:', product.name);
    return res.json(product);
  }
  
  console.log('No matching path found:', cleanPath);
  res.status(404).json({ error: 'Endpoint not found', path: cleanPath });
});

app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug route
app.get('/api/debug', (req, res) => {
  res.json({
    products: products.length,
    categories: categories.length,
    environment: process.env.NODE_ENV,
    path: req.path,
    query: req.query
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

// Handle 404
app.use('*', (req, res) => {
  console.log('404 for path:', req.path);
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

const serverlessHandler = serverlessHttp(app);

export const handler = async (event, context) => {
  try {
    console.log('Handler called:', {
      httpMethod: event.httpMethod,
      path: event.path,
      query: event.queryStringParameters
    });
    
    const result = await serverlessHandler(event, context);
    console.log('Handler completed successfully');
    return result;
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Function execution failed', 
        message: error.message
      })
    };
  }
};
