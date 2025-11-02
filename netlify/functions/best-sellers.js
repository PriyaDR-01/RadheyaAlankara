import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handler = async (event, context) => {
  console.log('Best sellers function called');
  console.log('Event path:', event.path);
  console.log('Event method:', event.httpMethod);
  
  try {
    // Load products data
    const dataPath = path.join(__dirname, 'data', 'products.json');
    console.log('Reading from:', dataPath);
    
    const productsData = readFileSync(dataPath, 'utf-8');
    const products = JSON.parse(productsData);
    
    console.log('Total products loaded:', products.length);
    
    // Filter best sellers
    const bestSellers = products.filter(product => product.isBestSeller === 1);
    console.log('Best sellers found:', bestSellers.length);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(bestSellers)
    };
  } catch (error) {
    console.error('Error in best-sellers function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack,
        __dirname: __dirname
      })
    };
  }
};