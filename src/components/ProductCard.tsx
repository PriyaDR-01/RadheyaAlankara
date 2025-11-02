import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useToast } from '@/hooks/use-toast';

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

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
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

  return (
    <Link href={`/product/${product.slug || product.id}`} data-testid={`link-product-${product.id}`}>
      <div className="cursor-pointer">
        <Card className="group overflow-hidden border-2 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 hover-elevate transition-all duration-300 h-full shadow-sm hover:shadow-md">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={product.images[0]}
              alt={product.name}
              width={400}
              height={400}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              data-testid={`img-product-${product.id}`}
            />
            {product.isBestSeller === 1 && (
              <Badge
                className="absolute top-3 left-3 bg-gold-600 text-white border-0 shadow-md"
                data-testid={`badge-bestseller-${product.id}`}
              >
                Best Seller
              </Badge>
            )}
            {product.isNewArrival === 1 && (
              <Badge
                className="absolute top-3 left-3 bg-bronze-600 text-white border-0 shadow-md"
                data-testid={`badge-newarrival-${product.id}`}
              >
                New
              </Badge>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                size="icon"
                onClick={handleAddToCart}
                className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 bg-gold-600 hover:bg-gold-700 border-gold-500"
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
            <p
              className="font-accent text-xl md:text-2xl font-semibold text-gold-600"
              data-testid={`text-product-price-${product.id}`}
            >
              ₹{parseFloat(product.price).toFixed(2)}
            </p>
          </div>
        </Card>
      </div>
    </Link>
  );
}
