import { createRequire } from "module"; const require = createRequire(import.meta.url);

// netlify/functions/api.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var getDataPath = (filename) => {
  return path.join(__dirname, "data", filename);
};
var readJsonFile = (filename) => {
  try {
    const filePath = getDataPath(filename);
    console.log("Attempting to read file:", filePath);
    if (!fs.existsSync(filePath)) {
      console.error("File does not exist:", filePath);
      console.log("Available files in directory:", fs.readdirSync(path.dirname(filePath)));
      return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(data);
    console.log(`Successfully loaded ${filename} with ${parsed.length || 0} items`);
    return parsed;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    console.log("Working directory:", process.cwd());
    console.log("Function directory:", __dirname);
    return [];
  }
};
var handler = async (event, context) => {
  const { httpMethod, queryStringParameters } = event;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }
  if (httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" })
    };
  }
  try {
    const apiPath = "/" + (queryStringParameters?.path || "products");
    console.log("API Path:", apiPath);
    console.log("Query parameters:", queryStringParameters);
    switch (apiPath) {
      case "/products":
        const products = readJsonFile("products.json");
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(products)
        };
      case "/products/best-sellers":
        const allProducts = readJsonFile("products.json");
        const bestSellers = allProducts.filter((p) => p.isBestSeller === 1);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(bestSellers)
        };
      case "/products/new-arrivals":
        const productsForNew = readJsonFile("products.json");
        const newArrivals = productsForNew.filter((p) => p.isNewArrival === 1);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(newArrivals)
        };
      case "/categories":
        const categories = readJsonFile("categories.json");
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(categories)
        };
      default:
        if (apiPath.startsWith("/products/")) {
          const category = apiPath.replace("/products/", "");
          const categoryProducts = readJsonFile("products.json");
          const filtered = categoryProducts.filter((p) => p.category === category);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(filtered)
          };
        }
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: "API endpoint not found" })
        };
    }
  } catch (error) {
    console.error("API Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};
export {
  handler
};
