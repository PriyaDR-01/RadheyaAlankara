import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Use environment variable for Stripe secret key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get best sellers
  app.get("/api/products/best-sellers", async (req, res) => {
    try {
      const products = await storage.getBestSellers();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get product by slug
  app.get("/api/products/slug/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get products by category
  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const products = await storage.getProductsByCategory(req.params.category);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Verify Stripe payment intent
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }

      res.json({
        // status: paymentIntent.status,
        // amount: paymentIntent.amount,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      // Validate request body
      const result = insertOrderSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.toString() });
      }

      const order = await storage.createOrder(result.data);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
};

// Register new user
app.post('/api/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });
  let users: User[] = [];
  try {
    users = await storage.getAllUsers();
  } catch { users = []; }
  if (users.find((u: User) => u.email === email || u.phone === phone)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  const user: User = { id: uuidv4(), name, email, phone, password };
  users.push(user);
  await storage.writeUsers(users);
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone });
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, phone, password } = req.body;
  let users: User[] = [];
  try {
    users = await storage.getAllUsers();
  } catch { users = []; }
  const user: User | undefined = users.find((u: User) => (u.email === email || u.phone === phone));
  if (!user) return res.status(404).json({ error: 'Invalid user not found, please register' });
  if (user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone });
});

  const httpServer = createServer(app);

  return httpServer;
}
