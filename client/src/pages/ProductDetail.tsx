import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Product } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useState, useEffect } from 'react';

export default function ProductDetail() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const [, params] = useRoute('/product/:slug');
  const { addItem, openCart } = useCart();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products/slug', params?.slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/slug/${params?.slug}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      return res.json();
    },
    enabled: !!params?.slug,
  });
  const handleAddToCart = async () => {
    if (!product) return;
    
    // Check if product is out of stock
    if (product.stock === 0) {
      toast({
        title: 'Out of Stock',
        description: `${product.name} is currently out of stock.`,
        variant: 'destructive',
      });
      return;
    }
    
    const success = await addItem({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.images[0],
    });
    
    if (success) {
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
      openCart();
    } else {
      toast({
        title: 'Cannot add to cart',
        description: `${product.name} is out of stock or insufficient stock available.`,
        variant: 'destructive',
      });
    }
  };

  const nextImage = () => {
    if (product && product.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };
  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };
  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product]);
  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (product && product.images.length > 1) {
        if (e.key === 'ArrowLeft') {
          setCurrentImageIndex((prev) => 
            prev === 0 ? product.images.length - 1 : prev - 1
          );
        } else if (e.key === 'ArrowRight') {
          setCurrentImageIndex((prev) => 
            prev === product.images.length - 1 ? 0 : prev + 1
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [product]);

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
  // Debug: Log product images
  console.log('Product:', product.name);
  console.log('Images count:', product.images.length);
  console.log('Images:', product.images);
  console.log('Current index:', currentImageIndex);
  console.log('Should show navigation:', product.images.length > 1);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <Link href="/" data-testid="link-back">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Back to Shopping
          </span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">          {/* Product Images with Swiper */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted group">              <img
                src={product.images[currentImageIndex]}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover object-center transition-transform duration-300"
                data-testid="img-product-main"
              />
                {/* Image Counter */}
              {product.images.length > 1 && (
                <div className="absolute top-4 right-4 bg-background/80 text-foreground px-2 py-1 rounded-md text-sm font-medium shadow-sm">
                  {currentImageIndex + 1} / {product.images.length}
                </div>
              )}
              
              
              {/* Badge */}
              {product.isNewArrival === 1 ? (
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  New Arrival
                </Badge>
              ) : product.isBestSeller === 1 ? (
                <Badge className="absolute top-4 left-4 bg-chart-2 text-primary-foreground border-0">
                  Best Seller
                </Badge>
              ) : null}              {/* Navigation Arrows - Always visible if more than 1 image */}
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 border-2 border-gray-300 shadow-lg opacity-100 transition-all z-20 rounded-full"
                    onClick={prevImage}
                    data-testid="button-prev-image"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 border-2 border-gray-300 shadow-lg opacity-100 transition-all z-20 rounded-full"
                    onClick={nextImage}
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </Button>
                </>
              )}
              
               {/* Image Indicators */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors border-2 ${
                        index === currentImageIndex
                          ? 'bg-primary border-primary'
                          : 'bg-background/60 hover:bg-background/80 border-background/60 hover:border-background/80'
                      }`}
                      onClick={() => goToImage(index)}
                      data-testid={`indicator-${index}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Images - Only show if more than 1 image */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? 'border-primary'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                    onClick={() => goToImage(index)}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-4xl font-light mb-4" data-testid="text-product-name">
                {product.name}
              </h1>
              
              <p className="font-sans text-4xl font-semibold text-chart-2" data-testid="text-product-price">
                {parseFloat(product.price).toFixed(2)}
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
                disabled={product.stock === 0}
                data-testid="button-add-to-cart"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>

            {/* Stock Status */}
            <div className="space-y-2">
              {product.stock === 0 ? (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Out of Stock</Badge>
                  <p className="text-sm text-muted-foreground">
                    This item is currently unavailable
                  </p>
                </div>
              ) : product.stock < 10 ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Low Stock</Badge>
                  <p className="text-sm text-muted-foreground">
                    Only {product.stock} left in stock
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">In Stock</Badge>
                  <p className="text-sm text-muted-foreground">
                    Available ({product.stock} items)
                  </p>
                </div>
              )}
            </div>

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
