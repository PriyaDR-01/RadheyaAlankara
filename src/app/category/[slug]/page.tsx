'use client'

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';

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

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/category', slug],
    queryFn: async () => {
      let url = '/api/products';
      if (slug === 'best-sellers') {
        url = '/api/products/best-sellers';
      } else if (slug === 'new-arrivals') {
        url = '/api/products/new-arrivals';
      } else if (slug !== 'all') {
        url = `/api/products/category/${slug}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
    enabled: !!slug,
  });

  const categoryTitles: Record<string, { title: string; subtitle: string }> = {
    rings: { title: 'Rings', subtitle: 'Symbols of eternal love and commitment' },
    earrings: { title: 'Earrings', subtitle: 'Elegant accents for every occasion' },
    necklaces: { title: 'Necklaces', subtitle: 'Statement pieces that capture attention' },
    bracelets: { title: 'Bracelets', subtitle: 'Delicate adornments for your wrist' },
    'best-sellers': { title: 'Best Sellers', subtitle: 'Our most loved pieces' },
    'new-arrivals': { title: 'New Arrivals', subtitle: 'Fresh designs just for you' },
    all: { title: 'All Jewelry', subtitle: 'Browse our complete collection' },
  };

  const categoryInfo = slug 
    ? categoryTitles[slug] || { title: 'Products', subtitle: 'Explore our collection' }
    : { title: 'Products', subtitle: 'Explore our collection' };
  return (
    <div className="min-h-screen">      
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <h1 className="font-serif text-5xl font-light mb-2" data-testid="text-category-title">
            {categoryInfo.title}
          </h1>
          <p className="text-lg text-muted-foreground">{categoryInfo.subtitle}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-2xl font-light mb-4">No products found</h3>
            <p className="text-muted-foreground">Check back soon for new arrivals!</p>          </div>
        )}
      </div>
    </div>
  );
}
