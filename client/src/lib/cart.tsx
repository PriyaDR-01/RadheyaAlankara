import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { CartItem } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<boolean>;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  clearCart: () => void;
  itemCount: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  getProductStock: (productId: string) => number | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [productStocks, setProductStocks] = useState<Record<string, number>>({});
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });
  const [isOpen, setIsOpen] = useState(false);

  // Fetch all product stocks on mount and when cart changes
  useEffect(() => {
    async function fetchStocks() {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        const stocks: Record<string, number> = {};
        products.forEach((p: any) => {
          stocks[p.id] = p.stock;
        });
        setProductStocks(stocks);
      } catch (error) {
        console.error('Error fetching product stocks:', error);
      }
    }
    fetchStocks();
  }, [items]);
  // Get current stock for a product
  const getProductStock = (productId: string): number | undefined => {
    return productStocks[productId];
  };
  // ...existing code...

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Check product stock
  const checkStock = async (productId: string, requestedQuantity: number): Promise<{ available: boolean; stock: number }> => {
    try {
      const response = await fetch(`/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const products = await response.json();
      const product = products.find((p: any) => p.id === productId);
      
      if (!product) {
        return { available: false, stock: 0 };
      }
      
      return { 
        available: product.stock >= requestedQuantity, 
        stock: product.stock 
      };
    } catch (error) {
      console.error('Error checking stock:', error);
      return { available: false, stock: 0 };
    }
  };

  const addItem = async (item: Omit<CartItem, 'quantity'> & { quantity?: number }): Promise<boolean> => {
    const quantityToAdd = item.quantity || 1;
    const existing = items.find(i => i.productId === item.productId);
    const currentQuantity = existing ? existing.quantity : 0;
    const totalQuantity = currentQuantity + quantityToAdd;
    
    // Get fresh stock data
    const { available, stock } = await checkStock(item.productId, totalQuantity);
    
    if (!available) {
      console.log(`❌ Cannot add ${item.name}: Requested ${totalQuantity}, Available ${stock}`);
      return false; // Stock check failed
    }
    
    setItems(current => {
      const existing = current.find(i => i.productId === item.productId);
      if (existing) {
        return current.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + quantityToAdd }
            : i
        );
      }
      return [...current, { ...item, quantity: quantityToAdd }];
    });
    
    console.log(`✅ Added ${item.name} to cart: quantity ${totalQuantity}, stock available ${stock}`);
    return true; // Successfully added
  };

  const removeItem = (productId: string) => {
    setItems(current => current.filter(i => i.productId !== productId));
  };

  const updateQuantity = async (productId: string, quantity: number): Promise<boolean> => {
    if (quantity <= 0) {
      removeItem(productId);
      return true;
    }
    
    // Get fresh stock data
    const { available, stock } = await checkStock(productId, quantity);
    
    if (!available) {
      const item = items.find(i => i.productId === productId);
      console.log(`❌ Cannot update ${item?.name}: Requested ${quantity}, Available ${stock}`);
      return false; // Stock check failed
    }
    
    setItems(current =>
      current.map(i => (i.productId === productId ? { ...i, quantity } : i))
    );
    
    const item = items.find(i => i.productId === productId);
    console.log(`✅ Updated ${item?.name} quantity to ${quantity}, stock available ${stock}`);
    return true; // Successfully updated
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        getProductStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
