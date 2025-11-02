import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Product } from '@shared/schema';
import { ProductCard } from '@/components/ProductCard';

export default function CategoryPage() {
  const [, params] = useRoute('/category/:slug');
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/category', params?.slug],
    enabled: !!params?.slug,
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

  const categoryInfo = params?.slug 
    ? categoryTitles[params.slug] || { title: 'Products', subtitle: 'Explore our collection' }
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
            <p className="text-muted-foreground text-lg">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
