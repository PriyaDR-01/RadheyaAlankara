import { type Product, type InsertProduct, type Category, type InsertCategory } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- User type for user storage ---
export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
};

// Determine data directory based on environment
const getDataDir = () => {
  // Prefer common locations where data may be placed during builds or function bundling
  const candidates = [
    path.join(process.cwd(), 'data'), // top-level data (root)
    path.join(process.cwd(), 'netlify', 'functions', 'data'), // copied into netlify/functions/data
    path.join(__dirname, '..', 'data'), // relative to server folder
    path.join(__dirname, 'data'),
  ];

  for (const candidate of candidates) {
    try {
      if (fsSync.existsSync(candidate)) return candidate;
    } catch (e) {
      // ignore and continue
    }
  }

  // fallback to root data path
  return path.join(process.cwd(), 'data');
};

const DATA_DIR = getDataDir();
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export interface IStorage {
  // Products
  getAllProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getBestSellers(): Promise<Product[]>;
  getNewArrivals(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(categoryId: string, updates: Partial<Category>): Promise<Category | null>;
  deleteCategory(categoryId: string): Promise<Category | null>;
    // Orders
  createOrder(order: any): Promise<any>;
  getOrderById(id: string): Promise<any>;
  getAllOrders(): Promise<any[]>;
  deleteOrder(orderId: string): Promise<any | null>;
  updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<any | null>;
    // Product management
  updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null>;
  deleteProduct(productId: string): Promise<Product | null>;
  reloadProducts(): Promise<void>;
  
  // User management
  getAllUsers(): Promise<User[]>;
  writeUsers(users: User[]): Promise<void>;
  
  // Stock management
  validateAndReduceStock(orderItems: any[]): Promise<{ success: boolean; message?: string; outOfStockItems?: any[] }>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private categories: Map<string, Category>;
  private orders: Map<string, any>;
  private initialized: boolean = false;

  constructor() {
    this.products = new Map();
    this.categories = new Map();
    this.orders = new Map();
    this.init();
  }

  private async init() {
    if (this.initialized) return;

    try {
      console.log('Initializing storage with DATA_DIR:', DATA_DIR);
      await fs.mkdir(DATA_DIR, { recursive: true });

      // Load products (prefer read-only built data in dist/public/api when available)
      try {
        const productsPathCandidates = [
          path.join(process.cwd(), 'dist', 'public', 'api', 'products.json'),
          path.join(process.cwd(), 'netlify', 'functions', 'data', 'products.json'),
          PRODUCTS_FILE,
          path.join(__dirname, '..', 'data', 'products.json')
        ];

        let productsData: string | null = null;
        for (const pPath of productsPathCandidates) {
          try {
            if (fsSync.existsSync(pPath)) {
              console.log('Reading products from:', pPath);
              productsData = await fs.readFile(pPath, 'utf-8');
              break;
            }
          } catch (e) {
            // ignore and continue
          }
        }

        if (!productsData) {
          console.log('products.json not found in candidates, seeding initial data');
          await this.seedInitialData();
        } else {
          const products: Product[] = JSON.parse(productsData);
          products.forEach(p => this.products.set(p.id, p));
          console.log(`Loaded ${products.length} products`);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        await this.seedInitialData();
      }

      // Load categories (prefer dist/public/api)
      try {
        const categoriesPathCandidates = [
          path.join(process.cwd(), 'dist', 'public', 'api', 'categories.json'),
          path.join(process.cwd(), 'netlify', 'functions', 'data', 'categories.json'),
          CATEGORIES_FILE,
          path.join(__dirname, '..', 'data', 'categories.json')
        ];
        let categoriesData: string | null = null;
        for (const cPath of categoriesPathCandidates) {
          try {
            if (fsSync.existsSync(cPath)) {
              categoriesData = await fs.readFile(cPath, 'utf-8');
              break;
            }
          } catch (e) {}
        }
        if (categoriesData) {
          const categories: Category[] = JSON.parse(categoriesData);
          categories.forEach(c => this.categories.set(c.id, c));
        }
      } catch (error) {
        // ignore - categories seeded in seedInitialData if missing
      }

      // Load orders (orders are write-heavy; try to read from DATA_DIR only)
      try {
        if (fsSync.existsSync(ORDERS_FILE)) {
          const ordersData = await fs.readFile(ORDERS_FILE, 'utf-8');
          const orders: any[] = JSON.parse(ordersData);
          orders.forEach(o => this.orders.set(o.id, o));
        }
      } catch (error) {
        // File doesn't exist yet, will be created on first write
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  private async saveProducts() {
    const products = Array.from(this.products.values());
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  }

  private async saveCategories() {
    const categories = Array.from(this.categories.values());
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
  }

  private async saveOrders() {
    const orders = Array.from(this.orders.values());
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
  }

  // Method to reload products from file (for admin updates)
  async reloadProducts() {
    try {
      console.log('Reloading products from file...');
      if (fsSync.existsSync(PRODUCTS_FILE)) {
        const productsData = await fs.readFile(PRODUCTS_FILE, 'utf-8');
        const products: Product[] = JSON.parse(productsData);
        
        // Clear existing products and reload
        this.products.clear();
        products.forEach(p => this.products.set(p.id, p));
        
        console.log(`Reloaded ${products.length} products`);
      }
    } catch (error) {
      console.error('Error reloading products:', error);
    }
  }

  // Method to update a product and save to file
  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null> {
    await this.init();
    
    const existingProduct = this.products.get(productId);
    if (!existingProduct) {
      return null;
    }

    // Update the product in memory
    const updatedProduct = { ...existingProduct, ...updates };
    this.products.set(productId, updatedProduct);
    
    // Save to file
    await this.saveProducts();
    
    return updatedProduct;
  }

  // Method to delete a product
  async deleteProduct(productId: string): Promise<Product | null> {
    await this.init();
    
    const product = this.products.get(productId);
    if (!product) {
      return null;
    }

    // Delete associated image files from the file system
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        try {
          // Extract filename from URL (e.g., "/attached_assets/products/filename.jpg" -> "filename.jpg")
          const filename = imageUrl.split('/').pop();
          
          if (filename && imageUrl.includes('/attached_assets/')) {
            let filePath: string;
            
            // Determine the correct directory based on the URL path
            if (imageUrl.includes('/attached_assets/products/')) {
              filePath = path.join(process.cwd(), 'attached_assets', 'products', filename);
            } else if (imageUrl.includes('/attached_assets/generated_images/')) {
              filePath = path.join(process.cwd(), 'attached_assets', 'generated_images', filename);
            } else {
              // For any other subdirectory under attached_assets
              const urlParts = imageUrl.split('/');
              const subdirectory = urlParts[urlParts.length - 2]; // Get the directory name
              filePath = path.join(process.cwd(), 'attached_assets', subdirectory, filename);
            }
            
            // Check if file exists and delete it
            if (fsSync.existsSync(filePath)) {
              try {
                await fs.unlink(filePath);
              } catch (unlinkError) {
                console.error(`Failed to delete image file ${filePath}:`, unlinkError);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to delete image file ${imageUrl}:`, error);
          // Continue with deletion even if image file deletion fails
        }
      }
    }

    // Remove from memory
    this.products.delete(productId);
    
    // Save to file
    await this.saveProducts();
    
    return product;
  }

  private async seedInitialData() {
    // Seed categories
    const categories: Category[] = [
      { id: randomUUID(), name: 'Rings', slug: 'rings', description: 'Symbols of eternal love and commitment', image: '' },
      { id: randomUUID(), name: 'Earrings', slug: 'earrings', description: 'Elegant accents for every occasion', image: '' },
      { id: randomUUID(), name: 'Necklaces', slug: 'necklaces', description: 'Statement pieces that capture attention', image: '' },
      { id: randomUUID(), name: 'Bracelets', slug: 'bracelets', description: 'Delicate adornments for your wrist', image: '' },
    ];
    
    categories.forEach(c => this.categories.set(c.id, c));
    await this.saveCategories();

    // Seed products
    const products: Product[] = [
      {
        id: randomUUID(),
        name: 'Pearl Stud Earrings',
        slug: 'pearl-stud-earrings',
        description: 'Timeless elegance with lustrous pearls set in 14k gold. These classic studs are perfect for any occasion.',
        price: '125.00',
        category: 'earrings',
        images: ['/attached_assets/generated_images/Gold_pearl_stud_earrings_b1fe2830.png'],
        stock: 15,
        isBestSeller: 1,
        isNewArrival: 0,
        material: '14k Gold, Freshwater Pearls',
      },
      {
        id: randomUUID(),
        name: 'Wave Bangle',
        slug: 'wave-bangle',
        description: 'Flowing curves capture the essence of water in motion. Handcrafted in 18k gold.',
        price: '285.00',
        category: 'bracelets',
        images: ['/attached_assets/generated_images/Gold_wave_bangle_bracelet_8bbe3a36.png'],
        stock: 8,
        isBestSeller: 1,
        isNewArrival: 0,
        material: '18k Gold',
      },
      {
        id: randomUUID(),
        name: 'Collar Necklace',
        slug: 'collar-necklace',
        description: 'A sophisticated statement piece that frames your neckline beautifully. Modern luxury at its finest.',
        price: '465.00',
        category: 'necklaces',
        images: ['/attached_assets/generated_images/Gold_collar_necklace_ecf1d78f.png'],
        stock: 5,
        isBestSeller: 1,
        isNewArrival: 0,
        material: '18k Gold',
      },
      {
        id: randomUUID(),
        name: 'Golden Loop Earrings',
        slug: 'golden-loop-earrings',
        description: 'Classic hoop earrings with a contemporary twist. Lightweight and comfortable for all-day wear.',
        price: '145.00',
        category: 'earrings',
        images: ['/attached_assets/generated_images/Gold_loop_hoop_earrings_c6e47118.png'],
        stock: 20,
        isBestSeller: 1,
        isNewArrival: 0,
        material: '14k Gold',
      },
      {
        id: randomUUID(),
        name: 'Diamond Solitaire Ring',
        slug: 'diamond-solitaire-ring',
        description: 'A brilliant cut diamond set in platinum. The ultimate symbol of eternal love.',
        price: '1850.00',
        category: 'rings',
        images: ['/attached_assets/generated_images/Diamond_solitaire_ring_54bd7102.png'],
        stock: 3,
        isBestSeller: 0,
        isNewArrival: 1,
        material: 'Platinum, 1ct Diamond',
      },
      {
        id: randomUUID(),
        name: 'Chain Link Bracelet',
        slug: 'chain-link-bracelet',
        description: 'Delicate chain links create a refined look. Perfect for layering or wearing alone.',
        price: '195.00',
        category: 'bracelets',
        images: ['/attached_assets/generated_images/Gold_chain_link_bracelet_6e8dde3d.png'],
        stock: 12,
        isBestSeller: 0,
        isNewArrival: 1,
        material: '14k Gold',
      },
      {
        id: randomUUID(),
        name: 'Textured Band Ring',
        slug: 'textured-band-ring',
        description: 'Handcrafted texture adds depth and character to this versatile band.',
        price: '320.00',
        category: 'rings',
        images: ['/attached_assets/generated_images/Textured_gold_band_ring_556baf4d.png'],
        stock: 10,
        isBestSeller: 0,
        isNewArrival: 1,
        material: '18k Gold',
      },
      {
        id: randomUUID(),
        name: 'Gemstone Pendant Necklace',
        slug: 'gemstone-pendant-necklace',
        description: 'A vibrant gemstone suspended on a delicate gold chain. Effortlessly elegant.',
        price: '385.00',
        category: 'necklaces',
        images: ['/attached_assets/generated_images/Gold_gemstone_pendant_necklace_dab0c139.png'],
        stock: 7,
        isBestSeller: 0,
        isNewArrival: 1,
        material: '14k Gold, Natural Gemstone',
      },
    ];

    products.forEach(p => this.products.set(p.id, p));
    await this.saveProducts();
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    await this.init();
    return Array.from(this.products.values());
  }

  async getProductById(id: string): Promise<Product | undefined> {
    await this.init();
    return this.products.get(id);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    await this.init();
    return Array.from(this.products.values()).find(p => p.slug === slug);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    await this.init();
    if (category === 'all') {
      return Array.from(this.products.values());
    }
    if (category === 'best-sellers') {
      return this.getBestSellers();
    }
    if (category === 'new-arrivals') {
      return this.getNewArrivals();
    }
    return Array.from(this.products.values()).filter(p => p.category === category);
  }

  async getBestSellers(): Promise<Product[]> {
    await this.init();
    return Array.from(this.products.values()).filter(p => p.isBestSeller === 1);
  }

  async getNewArrivals(): Promise<Product[]> {
    await this.init();
    return Array.from(this.products.values()).filter(p => p.isNewArrival === 1);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    await this.init();
    const id = randomUUID();
    const product: Product = {
      id,
      name: insertProduct.name,
      slug: insertProduct.slug,
      description: insertProduct.description ?? null,
      price: insertProduct.price,
      category: insertProduct.category,
      images: insertProduct.images,
      stock: insertProduct.stock ?? 0,
      isBestSeller: insertProduct.isBestSeller ?? 0,
      isNewArrival: insertProduct.isNewArrival ?? 0,
      material: insertProduct.material ?? null,
    };
    this.products.set(id, product);
    await this.saveProducts();
    return product;
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    await this.init();
    return Array.from(this.categories.values());
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    await this.init();
    return Array.from(this.categories.values()).find(c => c.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    await this.init();
    const id = randomUUID();
    const category: Category = { 
      ...insertCategory, 
      id, 
      description: insertCategory.description ?? null, 
      image: insertCategory.image ?? null 
    };
    this.categories.set(id, category);
    await this.saveCategories();
    return category;
  }

  // Method to update a category and save to file
  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<Category | null> {
    await this.init();
    
    const existingCategory = this.categories.get(categoryId);
    if (!existingCategory) {
      return null;
    }

    // Update the category in memory
    const updatedCategory = { ...existingCategory, ...updates };
    this.categories.set(categoryId, updatedCategory);
    
    // Save to file
    await this.saveCategories();
    
    return updatedCategory;
  }

  // Method to delete a category
  async deleteCategory(categoryId: string): Promise<Category | null> {
    await this.init();
    
    const category = this.categories.get(categoryId);
    if (!category) {
      return null;
    }

    // Delete associated image file from the file system
    if (category.image) {
      try {
        // Extract filename from URL (e.g., "/attached_assets/categories/filename.jpg" -> "filename.jpg")
        const filename = category.image.split('/').pop();
        
        if (filename && category.image.includes('/attached_assets/categories/')) {
          const filePath = path.join(process.cwd(), 'attached_assets', 'categories', filename);
          
          // Check if file exists and delete it
          if (fsSync.existsSync(filePath)) {
            try {
              await fs.unlink(filePath);
            } catch (unlinkError) {
              console.error(`Failed to delete category image file ${filePath}:`, unlinkError);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to delete category image file ${category.image}:`, error);
        // Continue with deletion even if image file deletion fails
      }
    }

    // Remove from memory
    this.categories.delete(categoryId);
    
    // Save to file
    await this.saveCategories();
    
    return category;
  }

  // Orders
  async createOrder(orderData: any): Promise<any> {
    await this.init();
    
    // If ID is provided, use it (for JSON storage compatibility)
    const id = orderData.id || randomUUID();
    
    const order = {
      id,
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
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus || 'pending',
      orderStatus: orderData.orderStatus || 'processing',
      paymentId: orderData.paymentId || null,
      orderId: orderData.orderId || null,
      createdAt: orderData.createdAt || new Date().toISOString(),
    };
    
    this.orders.set(id, order);
    await this.saveOrders();
    console.log('Order saved to JSON file:', order);
    return order;
  }

  async getOrderById(id: string): Promise<any> {
    await this.init();
    return this.orders.get(id);
  }

  async getAllOrders(): Promise<any[]> {
    await this.init();
    return Array.from(this.orders.values());
  }

  async deleteOrder(orderId: string): Promise<any | null> {
    await this.init();
    
    const order = this.orders.get(orderId);
    if (!order) {
      return null;
    }

    // Remove from memory
    this.orders.delete(orderId);
    
    // Save to file
    await this.saveOrders();
    
    return order;
  }

  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<any | null> {
    await this.init();
    
    const order = this.orders.get(orderId);
    if (!order) {
      return null;
    }

    // Update order in memory
    const oldStatus = order.orderStatus;
    order.orderStatus = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    order.updatedAt = new Date().toISOString();

    // Save to file
    await this.saveOrders();
    
    return { ...order, oldStatus };
  }

  async writeUsers(users: User[]): Promise<void> {
     console.log('write users from storage');
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  }

  async getAllUsers(): Promise<User[]> {
    console.log('Reading users from storage');
    await this.init();
      const usersData = await fs.readFile(USERS_FILE, 'utf-8');
       console.log('Reading users from storage',usersData);
      return JSON.parse(usersData);
  }

  // Stock management
  async validateAndReduceStock(orderItems: any[]): Promise<{ success: boolean; message?: string; outOfStockItems?: any[] }> {
    await this.init();
    
    const outOfStockItems: any[] = [];
    const validationErrors: string[] = [];
    
    // First, validate all items have sufficient stock
    for (const item of orderItems) {
      const product = this.products.get(item.productId);
      
      if (!product) {
        validationErrors.push(`Product not found: ${item.name || item.productId}`);
        continue;
      }
      
      if (product.stock < item.quantity) {
        outOfStockItems.push({
          productId: item.productId,
          name: item.name || product.name,
          requestedQuantity: item.quantity,
          availableStock: product.stock
        });
        validationErrors.push(`Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${product.stock}`);
      }
    }
    
    // If any validation errors, return without reducing stock
    if (validationErrors.length > 0) {
      return {
        success: false,
        message: validationErrors.join('; '),
        outOfStockItems
      };
    }
    
    // All items have sufficient stock, now reduce the stock
    for (const item of orderItems) {
      const product = this.products.get(item.productId);
      
      if (product) {
        const updatedProduct = {
          ...product,
          stock: product.stock - item.quantity
        };
        
        this.products.set(item.productId, updatedProduct);
        console.log(`✅ Reduced stock for ${product.name}: ${product.stock} → ${updatedProduct.stock} (quantity ordered: ${item.quantity})`);
      }
    }
    
    // Save the updated products to file
    await this.saveProducts();
    
    return { success: true };
  }
}

export const storage = new MemStorage();
