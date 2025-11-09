import { Link } from 'wouter';
import { Product } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if product is out of stock based on current data
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
        description: `${product.name} is out of stock or insufficient stock available. Stock may have changed recently.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Link href={`/product/${product.slug}`} data-testid={`link-product-${product.id}`}>
      <div className="cursor-pointer">
        <Card className="group overflow-hidden border-card-border hover-elevate transition-all duration-300 h-full">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              data-testid={`img-product-${product.id}`}
            />
            {product.isBestSeller === 1 && (
              <Badge
                className="absolute top-3 left-3 bg-chart-2 text-primary-foreground border-0"
                data-testid={`badge-bestseller-${product.id}`}
              >
                Best Seller
              </Badge>
            )}
            {product.isNewArrival === 1 && (
              <Badge
                className="absolute top-3 left-3 bg-primary text-primary-foreground"
                data-testid={`badge-newarrival-${product.id}`}
              >
                New
              </Badge>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                size="icon"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                data-testid={`button-add-to-cart-${product.id}`}
              >
                <ShoppingBag className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 md:p-6">
            <h3
              className="font-serif text-base md:text-lg font-normal mb-2 line-clamp-2"
              data-testid={`text-product-name-${product.id}`}
            >
              {product.name}
            </h3>
            <div className="flex items-end justify-between">
              <p
                className="font-sans text-xl md:text-2xl font-semibold text-chart-2"
                data-testid={`text-product-price-${product.id}`}
              >
                ₹{parseFloat(product.price).toFixed(2)}
              </p>
              {product.stock === 0 ? (
                <Badge variant="destructive" className="text-xs">
                  Out of Stock
                </Badge>
              ) : product.stock < 5 ? (
                <Badge variant="secondary" className="text-xs">
                  Only {product.stock} left
                </Badge>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </Link>
  );
}
