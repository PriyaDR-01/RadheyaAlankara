import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Use environment variable for Stripe secret key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Razorpay configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_RalRLOkX6DS2M6';
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET || '6EcT6jd662uHHsE3POTGpVr5';

console.log('Razorpay configuration loaded:');
console.log('RAZORPAY_KEY_ID:', RAZORPAY_KEY_ID);
console.log('RAZORPAY_SECRET:', RAZORPAY_SECRET ? 'configured' : 'not configured');

// Import the real Razorpay SDK
import Razorpay from 'razorpay';

// Initialize Razorpay with actual SDK
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple test route
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working!", timestamp: new Date().toISOString() });
  });

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

  // Create Razorpay order
  app.post("/api/razorpay/order", async (req, res) => {
    try {
      const { total, customerName, customerEmail, customerPhone } = req.body;
      
      if (!total || !customerName || !customerEmail) {
        console.error('Missing required fields:', { total, customerName, customerEmail });
        return res.status(400).json({ message: "Missing required fields" });
      }

      const amount = Math.round(parseFloat(total) * 100); // Convert to paise
      const receipt = `receipt_${Date.now()}`;

      console.log('Creating Razorpay order with amount:', amount, 'paise');
      
      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt,
        payment_capture: true,
        notes: {
          customer_name: customerName,
          customer_email: customerEmail,
        }
      });

      // Return Razorpay order details for frontend payment
      // NOTE: We don't create the database order here - only after payment verification
      res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: RAZORPAY_KEY_ID,
      });
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      res.status(500).json({ message: error.message || 'Failed to create Razorpay order' });
    }
  });

  // Verify Razorpay payment
  app.post("/api/razorpay/verify", async (req, res) => {
    try {
      console.log('Verifying Razorpay payment:', req.body);
      
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        ...orderData
      } = req.body;

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ message: "Missing payment verification data" });
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        console.error('Invalid signature. Expected:', expectedSignature, 'Received:', razorpay_signature);
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      console.log('✅ Signature verified successfully - Payment is authentic!');
      console.log('💰 Payment ID:', razorpay_payment_id);
      console.log('📋 Order ID:', razorpay_order_id);

      // NOW create the order in the database since payment is verified
      const finalOrderData = {
        id: uuidv4(),
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        shippingAddress: orderData.shippingAddress,
        city: orderData.city,
        state: orderData.state,
        pinCode: orderData.pinCode,
        items: orderData.items,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        total: orderData.total,
        paymentMethod: 'razorpay',
        paymentStatus: 'completed', // Payment is verified, so mark as completed
        orderStatus: 'processing',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        createdAt: new Date().toISOString(),
      };

      // Create order in JSON file storage ONLY after payment verification
      const order = await storage.createOrder(finalOrderData);
      console.log('✅ Order successfully created in database after payment verification:', order.id);
      
      res.json({
        success: true,
        order,
        message: 'Payment verified and order created successfully'
      });
    } catch (error: any) {
      console.error('❌ Razorpay verification error:', error);
      res.status(500).json({ message: error.message || 'Payment verification failed' });
    }
  });

  // Razorpay webhook handler (for production)
  app.post("/api/razorpay/webhook", async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const webhookSignature = req.headers['x-razorpay-signature'];
      
      if (!webhookSecret) {
        console.warn('Razorpay webhook secret not configured');
        return res.status(400).json({ message: 'Webhook not configured' });
      }

      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== webhookSignature) {
        console.error('Invalid webhook signature');
        return res.status(400).json({ message: 'Invalid signature' });
      }

      const { event, payload } = req.body;
      
      // Handle different webhook events
      switch (event) {
        case 'payment.captured':
          // Update order status to paid
          console.log('Payment captured:', payload.payment.entity.id);
          // TODO: Update order in database
          break;
          
        case 'payment.failed':
          // Handle failed payment
          console.log('Payment failed:', payload.payment.entity.id);
          // TODO: Update order status
          break;
          
        default:
          console.log('Unhandled webhook event:', event);
      }

      res.json({ status: 'ok' });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Debug endpoint to test Razorpay setup
  app.get("/api/razorpay/test", async (req, res) => {
    try {
      console.log('Testing Razorpay configuration...');
      console.log('RAZORPAY_KEY_ID:', RAZORPAY_KEY_ID);
      console.log('RAZORPAY_SECRET:', RAZORPAY_SECRET ? 'configured' : 'not configured');
      
      // Test order creation
      const testOrder = await razorpay.orders.create({
        amount: 10000, // 100 rupees in paise
        currency: 'INR',
        receipt: 'test_receipt_' + Date.now(),
        payment_capture: true,
      });
      
      res.json({
        success: true,
        message: 'Razorpay test successful',
        config: {
          key_id: RAZORPAY_KEY_ID,
          secret_configured: !!RAZORPAY_SECRET
        },
        test_order: testOrder
      });
    } catch (error: any) {
      console.error('Razorpay test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Razorpay test failed',
        error: error.message
      });
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
      console.log('Creating order with data:', req.body);
      
      // Create order data with proper structure for JSON storage
      const orderData = {
        id: uuidv4(),
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone,
        shippingAddress: req.body.shippingAddress,
        city: req.body.city,
        state: req.body.state,
        pinCode: req.body.pinCode,
        items: req.body.items,
        subtotal: req.body.subtotal,
        shipping: req.body.shipping,
        total: req.body.total,
        paymentMethod: req.body.paymentMethod,
        paymentStatus: req.body.paymentMethod === 'cod' ? 'pending' : 'completed',
        orderStatus: 'processing',
        paymentId: req.body.paymentId || null,
        orderId: req.body.orderId || null,
        createdAt: new Date().toISOString(),
      };

      const order = await storage.createOrder(orderData);
      console.log('Order created successfully:', order);
      res.json(order);
    } catch (error: any) {
      console.error('Order creation error:', error);
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
