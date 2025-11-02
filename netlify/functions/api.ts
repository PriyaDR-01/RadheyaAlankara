import { Handler } from '@netlify/functions';
import fs from 'fs';
import path from 'path';

// Simple storage implementation for Netlify Functions
const getDataPath = (filename: string) => {
  // In Netlify Functions, data files should be in the same directory or accessible
  return path.join(process.cwd(), 'data', filename);
};

const readJsonFile = (filename: string) => {
  try {
    const filePath = getDataPath(filename);
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

export const handler: Handler = async (event, context) => {
  const { path: requestPath, httpMethod } = event;
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    // Extract the API path from the Netlify function path
    const apiPath = requestPath.replace('/.netlify/functions/api', '');
    
    switch (apiPath) {
      case '/products':
        const products = readJsonFile('products.json');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(products),
        };

      case '/products/best-sellers':
        const allProducts = readJsonFile('products.json');
        const bestSellers = allProducts.filter((p: any) => p.isBestSeller === 1);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(bestSellers),
        };

      case '/products/new-arrivals':
        const productsForNew = readJsonFile('products.json');
        const newArrivals = productsForNew.filter((p: any) => p.isNewArrival === 1);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(newArrivals),
        };

      case '/categories':
        const categories = readJsonFile('categories.json');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(categories),
        };

      default:
        // Handle product category routes like /products/rings, /products/earrings, etc.
        if (apiPath.startsWith('/products/')) {
          const category = apiPath.replace('/products/', '');
          const categoryProducts = readJsonFile('products.json');
          const filtered = categoryProducts.filter((p: any) => p.category === category);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(filtered),
          };
        }

        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'API endpoint not found' }),
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
