import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/cart';
import Image from 'next/image';

interface OrderSummaryProps {
  shipping?: number;
}

export function OrderSummary({ shipping = 50 }: OrderSummaryProps) {
  const { items, total } = useCart();
  const shippingCost = total > 0 ? shipping : 0;
  const finalTotal = total + shippingCost;

  return (
    <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-serif text-xl font-normal">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-3 p-3 border border-gray-100 dark:border-gray-800 rounded-lg" data-testid={`summary-item-${item.productId}`}>
              <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-gray-200 dark:border-gray-700">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-1 mb-1">{item.name}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Qty: {item.quantity}</span>
                  <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span data-testid="text-summary-subtotal">₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span data-testid="text-summary-shipping">
              ₹{total > 0 ? `${shippingCost.toFixed(2)}` : '0.00'}
            </span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total</span>
          <span className="font-accent text-2xl font-semibold text-gold-600" data-testid="text-summary-total">
            ₹{finalTotal.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
