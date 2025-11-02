'use client'

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';

// Product interface
interface Product {
  id: string;
  name: string;
  slug?: string;
  description: string;
  price: string;
  category: string;
  images: string[];
  stock: number;
  isBestSeller?: number;
  isNewArrival?: number;
  material?: string;
}

export default function ProductDetail() {
  const params = useParams();
  const productId = params?.id as string;
  const { addItem, openCart } = useCart();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      return res.json();
    },
    enabled: !!productId,
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.images[0],
    });
    
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
    
    openCart();
  };
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
              <div className="h-20 bg-muted animate-pulse rounded" />
              <div className="h-12 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-12 text-center">
          <h2 className="text-2xl font-light mb-4">Product not found</h2>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen">      
      <div className="container mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover object-center"
                priority
              />
              {product.isBestSeller === 1 && (
                <Badge className="absolute top-4 left-4 bg-chart-2 text-primary-foreground border-0">
                  Best Seller
                </Badge>
              )}
              {product.isNewArrival === 1 && (
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  New Arrival
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-4xl font-light mb-2">{product.name}</h1>
              <p className="text-3xl font-light">₹{product.price}</p>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            <div className="space-y-4">
              <Button 
                onClick={handleAddToCart}
                size="lg" 
                className="w-full md:w-auto"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="details">
                <AccordionTrigger>Product Details</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {product.material && (
                      <p><strong>Material:</strong> {product.material}</p>
                    )}
                    <p><strong>Category:</strong> {product.category}</p>
                    <p><strong>Stock:</strong> {product.stock} available</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="care">
                <AccordionTrigger>Care Instructions</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>• Store in a clean, dry place away from direct sunlight</p>
                    <p>• Clean with a soft cloth after each use</p>
                    <p>• Avoid contact with perfumes, lotions, and chemicals</p>
                    <p>• Remove before swimming, exercising, or bathing</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping">
                <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>• Free shipping on orders over ₹2000</p>
                    <p>• Standard delivery: 3-5 business days</p>
                    <p>• 30-day return policy</p>
                    <p>• Free returns and exchanges</p>
                  </div>
                </AccordionContent>
              </AccordionItem>            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
