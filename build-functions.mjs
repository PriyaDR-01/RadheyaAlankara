import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildFunctions() {
  console.log('Building Netlify functions...');
  
  // Create netlify/functions directory
  const functionsDir = join(__dirname, 'netlify', 'functions');
  await fs.mkdir(functionsDir, { recursive: true });
    // Create express function wrapper for the server
  const expressFunction = `
import serverlessHttp from 'serverless-http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load data synchronously
let products = [];
let categories = [];
let orders = [];
let users = [];

try {
  const productsData = readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf-8');
  products = JSON.parse(productsData);
} catch (error) {
  console.error('Error loading products:', error);
}

try {
  const categoriesData = readFileSync(path.join(__dirname, 'data', 'categories.json'), 'utf-8');
  categories = JSON.parse(categoriesData);
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
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/best-sellers', (req, res) => {
  const bestSellers = products.filter(p => p.isBestSeller === 1);
  res.json(bestSellers);
});

app.get('/api/products/new-arrivals', (req, res) => {
  const newArrivals = products.filter(p => p.isNewArrival === 1);
  res.json(newArrivals);
});

app.get('/api/products/category/:category', (req, res) => {
  const { category } = req.params;
  const categoryProducts = products.filter(p => p.category === category);
  res.json(categoryProducts);
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const product = products.find(p => p.id === parseInt(id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
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

// Handle 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

export const handler = serverlessHttp(app);
`;

  await fs.writeFile(join(functionsDir, 'express.js'), expressFunction);
    // Create a simple products function as backup
  const productsFunction = `
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handler = async (event, context) => {
  try {
    // Load products data
    const productsData = readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf-8');
    const products = JSON.parse(productsData);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(products)
    };
  } catch (error) {
    console.error('Error in products function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
`;

  await fs.writeFile(join(functionsDir, 'products.js'), productsFunction);
  
  // Create debug function
  const debugFunction = `
export const handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify({
      message: 'Debug endpoint working',
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
        queryStringParameters: event.queryStringParameters
      },
      context: {
        functionName: context.functionName,
        functionVersion: context.functionVersion
      },
      timestamp: new Date().toISOString()
    })
  };
};
`;

  await fs.writeFile(join(functionsDir, 'debug.js'), debugFunction);
  
  console.log('✅ Netlify functions created successfully');
}

buildFunctions().catch(console.error);
