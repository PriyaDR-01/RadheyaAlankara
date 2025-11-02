'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { OrderSummary } from '@/components/OrderSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const checkoutFormSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  shippingAddress: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pinCode: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits'),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

// Add types for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const shipping = 50;
  const finalTotal = total + shipping;

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      shippingAddress: '',
      city: '',
      state: '',
      pinCode: '',
    },
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/');
    }
  }, [items.length, router]);

  const handleRazorpayPayment = async (orderData: CheckoutFormData) => {
    try {
      // Create Razorpay order
      const orderResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalTotal, currency: 'INR' }),
      });

      if (!orderResponse.ok) throw new Error('Failed to create payment order');
      
      const { orderId, amount, currency, keyId } = await orderResponse.json();

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Radheya Alankara',
        description: 'Jewelry Purchase',
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          await createOrder(orderData, response.razorpay_payment_id, orderId);
        },
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone,
        },
        theme: {
          color: '#F37254',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (formData: CheckoutFormData, paymentId?: string, orderId?: string) => {
    try {
      const orderData = {
        ...formData,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
        })),
        subtotal: total.toString(),
        shipping: shipping.toString(),
        total: finalTotal.toString(),
        paymentMethod,
        paymentStatus: paymentMethod === 'razorpay' ? 'completed' : 'pending',
        orderStatus: 'processing',
        paymentId: paymentId || null,
        orderId: orderId || null,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error('Failed to create order');

      const order = await response.json();
      
      clearCart();
      toast({
        title: 'Order Placed Successfully!',
        description: `Order #${order.id} has been created.`,
      });
      
      router.push(`/order-success?orderId=${order.id}`);
    } catch (error) {
      console.error('Order creation error:', error);
      toast({
        title: 'Order Error',
        description: 'Failed to create order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true);
    
    if (paymentMethod === 'razorpay') {
      if (!razorpayLoaded) {
        toast({
          title: 'Payment Error',
          description: 'Payment system is still loading. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      await handleRazorpayPayment(data);
    } else {
      await createOrder(data);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect
  }
  return (
    <div className="min-h-screen">      
      <div className="container mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl font-light mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Checkout Form */}
          <div>
            <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-2xl font-normal">Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="pinCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PIN Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Payment Method</Label>
                      <RadioGroup value={paymentMethod} onValueChange={(value: 'cod' | 'razorpay') => setPaymentMethod(value)}>
                        <div className="flex items-center space-x-2 p-4 border-2 border-gray-100 dark:border-gray-800 rounded-lg hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                          <RadioGroupItem value="cod" id="cod" />
                          <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                            <Banknote className="h-5 w-5" />
                            Cash on Delivery
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border-2 border-gray-100 dark:border-gray-800 rounded-lg hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                          <RadioGroupItem value="razorpay" id="razorpay" />
                          <Label htmlFor="razorpay" className="flex items-center gap-2 cursor-pointer">
                            <CreditCard className="h-5 w-5" />
                            Pay Online (Cards, UPI, Wallets)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : 'Proceed to Payment'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <OrderSummary shipping={shipping} />          </div>
        </div>
      </div>
    </div>
  );
}
