'use client';

import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export function ShoppingCart() {
  const { items, removeItem, updateQuantity, total, isOpen, closeCart } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl font-light">Shopping Cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-serif text-xl mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Add some beautiful jewelry to get started</p>
            <Link href="/category/all">
              <Button onClick={closeCart} data-testid="button-continue-shopping">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 p-4 border-2 border-gray-100 dark:border-gray-800 rounded-lg hover:border-gray-200 dark:hover:border-gray-700 transition-colors" data-testid={`cart-item-${item.productId}`}>
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-gray-200 dark:border-gray-700">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      data-testid={`img-cart-item-${item.productId}`}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 mb-2">
                      <h4 className="font-serif text-base line-clamp-1" data-testid={`text-cart-item-name-${item.productId}`}>
                        {item.name}
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => removeItem(item.productId)}
                        data-testid={`button-remove-${item.productId}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <p className="font-accent text-lg font-semibold text-gold-600 mb-3" data-testid={`text-cart-item-price-${item.productId}`}>
                      ₹{item.price.toFixed(2)}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        data-testid={`button-decrease-${item.productId}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-12 text-center font-medium" data-testid={`text-quantity-${item.productId}`}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        data-testid={`button-increase-${item.productId}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold" data-testid="text-cart-subtotal">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-muted-foreground">Calculated at checkout</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-accent text-2xl font-semibold text-gold-600" data-testid="text-cart-total">
                  ₹{total.toFixed(2)}
                </span>
              </div>

              <Link href="/checkout">
                <Button onClick={closeCart} className="w-full bg-gold-600 hover:bg-gold-700 text-white" size="lg" data-testid="button-checkout">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
