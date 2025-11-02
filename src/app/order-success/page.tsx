'use client'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import {Footer} from '@/components/Footer';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h1 className="font-serif text-4xl font-light mb-2">Order Confirmed!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for your purchase. Your order has been received and is being processed.
            </p>
          </div>

          {order && (
            <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-sm mb-8">
              <CardHeader>
                <CardTitle className="font-serif text-2xl font-normal">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Order ID</p>
                    <p className="font-mono">{order.id}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-semibold">₹{order.total}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Payment Method</p>
                    <p className="capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Order Status</p>
                    <p className="capitalize">{order.orderStatus}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Order Date: {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-serif text-xl mb-2">Processing Your Order</h3>
                <p className="text-sm text-muted-foreground">
                  We're preparing your jewelry with care. You'll receive a confirmation email shortly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-serif text-xl mb-2">Delivery Information</h3>
                <p className="text-sm text-muted-foreground">
                  Standard delivery takes 3-5 business days. Free shipping on orders over ₹2000.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Questions about your order? Contact us at{' '}
                <a href="mailto:support@radheyaalankara.com" className="text-blue-600 hover:underline">
                  support@radheyaalankara.com
                </a>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button variant="outline" size="lg">
                  Continue Shopping
                </Button>
              </Link>
              <Link href="/category/all">
                <Button size="lg">
                  Browse Collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
