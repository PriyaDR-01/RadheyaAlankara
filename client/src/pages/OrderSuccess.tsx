import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/lib/cart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2 } from 'lucide-react';
import { Order } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function OrderSuccess() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const [location] = useLocation();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const paymentParam = params.get('payment');
    const orderIdParam = params.get('orderId');
    const paymentIntentParam = params.get('payment_intent');

    // If it's a Stripe payment, verify payment success first
    if (paymentParam === 'upi' && paymentIntentParam) {
      const pendingOrderData = sessionStorage.getItem('pendingOrder');
      if (pendingOrderData) {
        setIsCreatingOrder(true);
        
        // First verify the payment was successful
        apiRequest('POST', '/api/verify-payment', { paymentIntentId: paymentIntentParam })
          .then(res => res.json())
          .then(paymentVerification => {
            const { status } = paymentVerification;
            
            // Handle successful and processing states
            if (status === 'succeeded' || status === 'processing') {
              // Payment successful or processing, create the order
              const orderData = JSON.parse(pendingOrderData);
              return apiRequest('POST', '/api/orders', orderData)
                .then(res => res.json())
                .then(order => {
                  sessionStorage.removeItem('pendingOrder');
                  setOrderId(order.id);
                  clearCart();
                  setIsCreatingOrder(false);
                  
                  if (status === 'processing') {
                    toast({
                      title: 'Payment Processing',
                      description: 'Your payment is being processed. You will receive a confirmation email shortly.',
                    });
                  }
                });
            } else {
              // Payment failed or requires additional action
              sessionStorage.removeItem('pendingOrder');
              toast({
                title: 'Payment Not Completed',
                description: 'Your payment was not completed. Please try again.',
                variant: 'destructive',
              });
              setIsCreatingOrder(false);
              // Redirect to checkout after a delay
              setTimeout(() => {
                window.location.href = '/checkout';
              }, 3000);
            }
          })
          .catch(error => {
            sessionStorage.removeItem('pendingOrder');
            toast({
              title: 'Error',
              description: 'Failed to verify payment. Please contact support.',
              variant: 'destructive',
            });
            setIsCreatingOrder(false);
          });
      }
    } else if (orderIdParam) {
      // COD payment - order already created
      setOrderId(orderIdParam);
      clearCart();
    }
  }, [location, clearCart, toast]);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
  });

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="font-serif text-3xl font-light">
                Order Confirmed!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-lg text-muted-foreground">
                Thank you for your purchase. Your order has been successfully placed.
              </p>
              
              {(isLoading || isCreatingOrder) ? (
                <div className="bg-muted/50 rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-32 mx-auto mb-2" />
                  <div className="h-6 bg-muted rounded w-48 mx-auto" />
                </div>
              ) : order && (
                <>
                  <div className="bg-muted/50 rounded-lg p-6">
                    <p className="text-sm text-muted-foreground mb-2">Order Number</p>
                    <p className="font-mono text-lg font-semibold" data-testid="text-order-id">
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div className="bg-card border rounded-lg p-6 text-left">
                    <h3 className="font-semibold mb-4">Order Summary</h3>
                    <div className="space-y-3 mb-4">
                      {(order.items as any[]).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>${parseFloat(order.shipping).toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold text-base">
                        <span>Total</span>
                        <span className="font-accent text-xl text-chart-2">
                          ${parseFloat(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="text-sm space-y-1">
                      <p className="font-medium">Delivery Address</p>
                      <p className="text-muted-foreground">{order.customerName}</p>
                      <p className="text-muted-foreground">{order.shippingAddress}</p>
                      <p className="text-muted-foreground">
                        {order.city}, {order.state} {order.pinCode}
                      </p>
                      <p className="text-muted-foreground">{order.customerPhone}</p>
                    </div>

                    <Separator className="my-4" />

                    <div className="text-sm">
                      <span className="font-medium">Payment Method: </span>
                      <span className="capitalize">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  A confirmation email will be sent to your email address shortly.
                </p>
                <p>
                  Your jewelry will be carefully packaged and shipped within 2-3 business days.
                </p>
              </div>

              <div className="pt-6 flex gap-4 justify-center">
                <Link href="/">
                  <Button size="lg" data-testid="button-continue-shopping">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
