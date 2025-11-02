import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Product } from '@shared/schema';
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

export default function ProductDetail() {
  const [, params] = useRoute('/product/:slug');
  const { addItem, openCart } = useCart();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products/slug', params?.slug],
    enabled: !!params?.slug,
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
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-muted animate-pulse rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
            <div className="h-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h2 className="font-serif text-2xl mb-4">Product not found</h2>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <Link href="/" data-testid="link-back">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Back to Shopping
          </span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="img-product-main"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square rounded-md overflow-hidden bg-muted">
                    <img
                      src={image}
                      alt={`${product.name} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.isBestSeller === 1 && (
                <Badge className="mb-3 bg-chart-2 text-primary-foreground border-0">Best Seller</Badge>
              )}
              {product.isNewArrival === 1 && (
                <Badge className="mb-3">New Arrival</Badge>
              )}
              
              <h1 className="font-serif text-4xl font-light mb-4" data-testid="text-product-name">
                {product.name}
              </h1>
              
              <p className="font-sans text-4xl font-semibold text-chart-2" data-testid="text-product-price">
                ${parseFloat(product.price).toFixed(2)}
              </p>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed" data-testid="text-product-description">
                {product.description}
              </p>
            )}

            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                data-testid="button-add-to-cart"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
            </div>

            {product.stock !== undefined && product.stock > 0 && product.stock < 10 && (
              <p className="text-sm text-muted-foreground">
                Only {product.stock} left in stock
              </p>
            )}

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="details">
                <AccordionTrigger>Product Details</AccordionTrigger>
                <AccordionContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="font-medium capitalize">{product.category}</dd>
                    </div>
                    {product.material && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Material</dt>
                        <dd className="font-medium">{product.material}</dd>
                      </div>
                    )}
                  </dl>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping">
                <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>Free shipping on orders over $200</p>
                  <p>Standard delivery: 5-7 business days</p>
                  <p>Easy returns within 30 days</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="care">
                <AccordionTrigger>Care Instructions</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>Clean with a soft, lint-free cloth</p>
                  <p>Store in a cool, dry place</p>
                  <p>Avoid contact with chemicals and perfumes</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
