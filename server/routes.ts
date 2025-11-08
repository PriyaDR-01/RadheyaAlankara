import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from './emailService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  // Serve static files from attached_assets
  app.use('/attached_assets', express.static(path.join(__dirname, '..', 'attached_assets')));

  // Simple test route
  app.get("/api/test", (req, res) => {
    res.json({ message: "Server is running!" });
  });

  // Admin authentication middleware
  const adminAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const isAdmin = req.headers['x-admin-token'] === 'admin-access' || 
                    (authHeader && authHeader.includes('admin@radheyaalankara.com'));
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  // Test email configuration endpoint (admin only)
  app.post("/api/admin/test-email", adminAuth, async (req, res) => {
    try {
      const { testEmailConfiguration } = await import('./emailService');
      const isConfigured = await testEmailConfiguration();
      
      if (isConfigured) {
        res.json({ success: true, message: 'Email configuration is valid' });
      } else {
        res.status(500).json({ success: false, message: 'Email configuration is invalid' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to test email configuration', error: String(error) });
    }
  });

  // Send test order confirmation email (admin only)
  app.post("/api/admin/send-test-email", adminAuth, async (req, res) => {
    try {
      const { email, orderId } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }

      // Find order by ID or use a sample order
      let order;
      if (orderId) {
        order = await storage.getOrderById(orderId);
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }
      } else {
        // Create a sample order for testing
        order = {
          id: 'TEST-' + Date.now(),
          customerName: 'Test Customer',
          customerEmail: email,
          customerPhone: '+91 98765 43210',
          shippingAddress: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pinCode: '123456',
          items: [{
            name: 'Test Jewelry Item',
            price: 1000,
            quantity: 1,
            image: '/attached_assets/products/sample.jpg'
          }],
          subtotal: 1000,
          shipping: 100,
          total: 1100,
          paymentStatus: 'completed',
          orderStatus: 'processing',
          createdAt: new Date().toISOString()
        };
      }

      const success = await sendOrderConfirmationEmail(order);
      
      if (success) {
        res.json({ success: true, message: `Test email sent successfully to ${email}` });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ success: false, message: 'Failed to send test email', error: String(error) });
    }
  });


  // Configure multer for file uploads
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '..', 'attached_assets', 'products');
      // Ensure the directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({ 
    storage: multerStorage,fileFilter: (req, file, cb) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  });
  // Upload image endpoint
  app.post("/api/admin/upload-image", adminAuth, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Return the file URL that can be used in the frontend
      const fileUrl = `/attached_assets/products/${req.file.filename}`;
      
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Delete image endpoint
  app.delete("/api/admin/delete-image", adminAuth, (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
      }

      // Extract filename from URL (e.g., "/attached_assets/products/filename.jpg" -> "filename.jpg")
      const filename = imageUrl.split('/').pop();
      
      if (!filename) {
        return res.status(400).json({ error: 'Invalid image URL' });
      }

      // Construct the full file path
      const filePath = path.join(__dirname, '..', 'attached_assets', 'products', filename);
      
      // Check if file exists and delete it
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Image deleted successfully' });
      } else {
        res.status(404).json({ error: 'Image file not found' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  });

  // Admin - Add new product
  app.post("/api/admin/products", adminAuth, async (req, res) => {
    try {
      const { name, description, price, category, images, isNewArrival, isBestSeller } = req.body;
      
      if (!name || !description || !price || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const slugify = (str: string) =>
        str
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, '');

      const insertProduct = {
        name: String(name),
        slug: slugify(String(name)),
        description: description ? String(description) : null,
        price: String(price),
        category: String(category),
        images: Array.isArray(images) ? images.map(String) : [],
        stock: 0,
        isNewArrival: isNewArrival ? 1 : 0,
        isBestSeller: isBestSeller ? 1 : 0,
        material: null,
      };

      // Use storage's createProduct method
      const newProduct = await storage.createProduct(insertProduct);

      res.json({ success: true, product: newProduct });
    } catch (error) {
      console.error('Error adding product:', error);
      res.status(500).json({ error: 'Failed to add product' });
    }
  });
  // Admin - Update existing product
  app.put("/api/admin/products/:productId", adminAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const { name, description, price, category, images, isNewArrival, isBestSeller } = req.body;
      
      if (!name || !description || !price || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const slugify = (str: string) =>
        str
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, '');

      // Prepare update data
      const updates = {
        name: String(name),
        slug: slugify(String(name)),
        description: description ? String(description) : null,
        price: String(price),
        category: String(category),
        images: Array.isArray(images) ? images.map(String) : [],
        isNewArrival: isNewArrival ? 1 : 0,
        isBestSeller: isBestSeller ? 1 : 0,
      };

      // Use storage method to update product
      const updatedProduct = await storage.updateProduct(productId, updates);

      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ success: true, product: updatedProduct });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });
  // Admin - Delete product
  app.delete("/api/admin/products/:productId", adminAuth, async (req, res) => {
    try {
      const { productId } = req.params;

      // Use storage method to delete product
      const deletedProduct = await storage.deleteProduct(productId);

      if (!deletedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ success: true, deletedProduct });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Category image upload endpoint
  const categoryUpload = multer({ 
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'attached_assets', 'categories');
        // Ensure the directory exists
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    }),
    fileFilter: (req, file, cb) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  });

  // Upload category image endpoint
  app.post("/api/admin/upload-category-image", adminAuth, categoryUpload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Return the file URL that can be used in the frontend
      const fileUrl = `/attached_assets/categories/${req.file.filename}`;
      
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Category image upload error:', error);
      res.status(500).json({ error: 'Failed to upload category image' });
    }
  });

  // Admin - Get all categories
  app.get("/api/admin/categories", adminAuth, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Admin - Add new category
  app.post("/api/admin/categories", adminAuth, async (req, res) => {
    try {
      const { name, description, image } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const slugify = (str: string) =>
        str
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, '');

      const insertCategory = {
        name: String(name),
        slug: slugify(String(name)),
        description: description ? String(description) : null,
        image: image ? String(image) : null,
      };

      // Use storage's createCategory method
      const newCategory = await storage.createCategory(insertCategory);

      res.json({ success: true, category: newCategory });
    } catch (error) {
      console.error('Error adding category:', error);
      res.status(500).json({ error: 'Failed to add category' });
    }
  });

  // Admin - Update existing category
  app.put("/api/admin/categories/:categoryId", adminAuth, async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { name, description, image } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      // Prepare update data
      const updates = {
        name: String(name),
        description: description ? String(description) : null,
        image: image ? String(image) : null,
      };

      // Use storage method to update category
      const updatedCategory = await storage.updateCategory(categoryId, updates);

      if (!updatedCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({ success: true, category: updatedCategory });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  // Admin - Delete category
  app.delete("/api/admin/categories/:categoryId", adminAuth, async (req, res) => {
    try {
      const { categoryId } = req.params;

      // Use storage method to delete category
      const deletedCategory = await storage.deleteCategory(categoryId);

      if (!deletedCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({ success: true, deletedCategory });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // Admin - Get all orders
  app.get("/api/admin/orders", adminAuth, async (req, res) => {
    try {      const orders = await storage.getAllOrders();
      // Sort by creation date (newest first)
      const sortedOrders = orders.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });
  // Admin - Update order status
  app.put("/api/admin/orders/:orderId/status", adminAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Use storage method to update order status
      const result = await storage.updateOrderStatus(orderId, status, trackingNumber);

      if (!result) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const { oldStatus, ...updatedOrder } = result;

      // Send status update email if status changed
      if (oldStatus !== status) {
        try {
          await sendOrderStatusUpdateEmail(updatedOrder, oldStatus, status, trackingNumber);
          console.log(`✅ Order status update email sent for order ${orderId}: ${oldStatus} → ${status}`);
        } catch (error) {
          console.error('❌ Failed to send order status update email:', error);
          // Don't fail the status update if email fails
        }
      }

      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Admin - Delete order
  app.delete("/api/admin/orders/:orderId", adminAuth, async (req, res) => {
    try {
      const { orderId } = req.params;

      // Use storage method to delete order
      const deletedOrder = await storage.deleteOrder(orderId);

      if (!deletedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log(`✅ Order ${orderId} deleted successfully`);
      res.json({ success: true, deletedOrder });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Failed to delete order' });
    }
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
      
      // Send order confirmation email
      try {
        await sendOrderConfirmationEmail(order);
        console.log('✅ Order confirmation email sent successfully');
      } catch (error) {
        console.error('❌ Failed to send order confirmation email:', error);
        // Don't fail the order creation if email fails
      }
      
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
