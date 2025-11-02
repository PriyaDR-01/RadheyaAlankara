// Direct products endpoint as backup
import fs from 'fs';
import path from 'path';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Try to read products.json from multiple locations
    const possiblePaths = [
      path.join(__dirname, 'data', 'products.json'),
      path.join(process.cwd(), 'netlify', 'functions', 'data', 'products.json'),
      './data/products.json',
      '../data/products.json'
    ];

    let data = [];
    let foundPath = '';

    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath)) {
          data = JSON.parse(fs.readFileSync(testPath, 'utf-8'));
          foundPath = testPath;
          break;
        }
      } catch (e) {
        console.log(`Failed to read from ${testPath}:`, e.message);
      }
    }

    if (data.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Products data not found',
          triedPaths: possiblePaths,
          cwd: process.cwd(),
          __dirname: __dirname || 'not available'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        products: data,
        meta: {
          count: data.length,
          foundAt: foundPath,
          timestamp: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      })
    };
  }
};
