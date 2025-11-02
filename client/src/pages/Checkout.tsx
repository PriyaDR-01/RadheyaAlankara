import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '@/lib/cart';
import { OrderSummary } from '@/components/OrderSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
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

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  key: string;
}

async function createRazorpayOrder(orderData: any): Promise<RazorpayOrder> {
  try {
    console.log('Creating Razorpay order with data:', orderData);
    
    // First test if API is reachable
    try {
      const testResponse = await fetch('/api/test');
      console.log('API test response status:', testResponse.status);
      if (!testResponse.ok) {
        console.error('API test failed, status:', testResponse.status);
      }
    } catch (testError) {
      console.error('API test completely failed:', testError);
    }
    
    const response = await apiRequest('POST', '/api/razorpay/order', orderData);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Error response:', responseText);
      
      // Check if we got HTML instead of JSON
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        throw new Error('Server returned HTML instead of JSON. This usually means the API route is not found or the server is not running correctly.');
      }
      
      // Try to parse as JSON, fall back to text
      let error;
      try {
        error = JSON.parse(responseText);
      } catch {
        error = { message: responseText };
      }
      
      throw new Error(error.message || 'Failed to create order');
    }
    
    const result = await response.json();
    console.log('Razorpay order created:', result);
    return result;
  } catch (error: any) {
    console.error('createRazorpayOrder error:', error);
    throw error;
  }
}

function CheckoutForm() {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const shippingCost = 50;
  const finalTotal = total + shippingCost;
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

  // COD submit handler
  const onSubmitCOD = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast({ title: 'Cart is empty', description: 'Please add items to your cart before checkout', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      const orderData = {
        ...data,
        items,
        subtotal: String(total),
        shipping: String(shippingCost),
        total: String(finalTotal),
        paymentMethod: 'cod'
      };
      const response = await apiRequest('POST', '/api/orders', orderData);
      const order = await response.json();
      clearCart(); // Clear the cart after successful order
      navigate(`/order-success?orderId=${order.id}`);
    } catch (error: any) {
      toast({ title: 'Order Failed', description: error.message || 'An error occurred during checkout', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };  
  
  // UPI submit handler
  const onSubmitUPI = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast({ title: 'Cart is empty', description: 'Please add items to your cart before checkout', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
      }

      const orderData = {
        ...data,
        items,
        subtotal: String(total),
        shipping: String(shippingCost),
        total: String(finalTotal),
        paymentMethod: 'upi',
      };
      
      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(orderData);

      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Radheya Alankara',
        description: 'Jewelry Order Payment',
        order_id: razorpayOrder.id,
        
        prefill: {
          name: data.customerName,
          email: data.customerEmail,
          contact: data.customerPhone
        },
        
        theme: { 
          color: '#F5C518'
        },
        
        handler: async function (response: RazorpayResponse) {
          try {
            setIsProcessing(true);
            const verifyResponse = await apiRequest('POST', '/api/razorpay/verify', {
              ...orderData,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verifyResponse.ok) {
              const error = await verifyResponse.json();
              throw new Error(error.message || 'Payment verification failed');
            }

            const result = await verifyResponse.json();
            clearCart();
            toast({ title: 'Payment Successful!', description: 'Your order has been placed successfully.' });
            navigate(`/order-success?orderId=${result.order.id}`);
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({ 
              title: 'Payment Verification Failed', 
              description: error.message || 'An error occurred during payment verification', 
              variant: 'destructive' 
            });
          } finally {
            setIsProcessing(false);
          }
        },
        
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast({ 
              title: 'Payment Cancelled', 
              description: 'You have cancelled the payment process.',
              variant: 'destructive'
            });
          }
        }
      };

      console.log('🔧 Razorpay configuration:', options);
      
      const rzp = new window.Razorpay(options);
      
      // Add event listeners
      rzp.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response);
        setIsProcessing(false);
        toast({ 
          title: 'Payment Failed', 
          description: response.error.description || 'Payment failed. Please try again.',
          variant: 'destructive'
        });
      });
      
      console.log('Opening Razorpay payment modal...');
      rzp.open();
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast({ 
        title: 'Payment Failed', 
        description: error.message || 'An error occurred during payment initialization', 
        variant: 'destructive' 
      });
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h2 className="font-serif text-2xl mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate('/')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6">
        <h1 className="font-serif text-4xl font-light mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={paymentMethod === 'cod' ? form.handleSubmit(onSubmitCOD) : (e) => e.preventDefault()} className="space-y-6">
                    {/* Contact and delivery fields (always visible) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="customerEmail" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Email or mobile phone number</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Email or mobile phone number" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="pt-6 border-t">
                      <h3 className="font-serif text-xl font-normal mb-4">Delivery</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="customerName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Full name" data-testid="input-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="shippingAddress" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address (House No, Building, Street, Area)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Address (House No, Building, Street, Area)" data-testid="input-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="City" data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="state" render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Karnataka" data-testid="input-state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="pinCode" render={({ field }) => (
                            <FormItem>
                              <FormLabel>PIN code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="PIN code" data-testid="input-pincode" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="customerPhone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" placeholder="Phone" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                    {/* Payment Method */}
                    <div className="pt-6 border-t">
                      <h3 className="font-serif text-xl font-normal mb-4">Payment</h3>
                      <RadioGroup value={paymentMethod} onValueChange={(value: 'upi' | 'cod') => setPaymentMethod(value)}>
                        <div className="space-y-3">
                          <Label htmlFor="upi" className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover-elevate`} data-testid="radio-payment-upi">
                            <RadioGroupItem value="upi" id="upi"/>
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex gap-2">
                                <CreditCard className="h-5 w-5" />
                                <Smartphone className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">UPI, Cards, and More</p>
                                <p className="text-sm text-muted-foreground">Pay with UPI, credit/debit cards via Razorpay</p>
                              </div>
                            </div>
                          </Label>                          {paymentMethod === 'upi' && (
                            <Button 
                              type="button" 
                              size="lg" 
                              className="w-full" 
                              disabled={isProcessing} 
                              onClick={form.handleSubmit(onSubmitUPI)} 
                              data-testid="button-pay-now"
                            >
                              {isProcessing ? 'Processing...' : 'Pay Now'}
                            </Button>
                          )}
                          <Label htmlFor="cod" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover-elevate" data-testid="radio-payment-cod">
                            <RadioGroupItem value="cod" id="cod" />
                            <div className="flex items-center gap-3 flex-1">
                              <Banknote className="h-5 w-5" />
                              <div className="flex-1">
                                <p className="font-medium">Cash on Delivery (COD)</p>
                                <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {paymentMethod === 'cod' && (
                      <Button type="submit" size="lg" className="w-full" disabled={isProcessing} data-testid="button-complete-order">
                        {isProcessing ? 'Processing...' : 'Complete Order'}
                      </Button>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          <div>
            <OrderSummary shipping={shippingCost} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return <CheckoutForm />;
}
