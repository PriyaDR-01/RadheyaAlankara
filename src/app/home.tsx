'use client'

import { useQuery } from '@tanstack/react-query';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Import types
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  category: string;
  images: string[];
  stock: number;
  isBestSeller?: number;
  isNewArrival?: number;
  material?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

const categoryImages: Record<string, string> = {
  rings: '/attached_assets/generated_images/Gold_rings_lifestyle_banner_c5c6d06b.png',
  earrings: '/attached_assets/generated_images/Gold_loop_hoop_earrings_c6e47118.png',
  necklaces: '/attached_assets/generated_images/Gold_collar_necklace_ecf1d78f.png',
  bracelets: '/attached_assets/generated_images/Gold_wave_bangle_bracelet_8bbe3a36.png',
};

export function Home() {
  const { data: bestSellers, isLoading: loadingBestSellers } = useQuery<Product[]>({
    queryKey: ['/api/products/best-sellers'],
    queryFn: async () => {
      const res = await fetch('/api/products/best-sellers');
      if (!res.ok) throw new Error('Failed to fetch best sellers');
      return res.json();
    },
  });

  const { data: categories, isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });
  return (
    <div className="min-h-screen">
      <Hero />

      {/* Best Sellers Section */}
      <section className="py-20 container mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="font-serif text-4xl font-light mb-2 text-gold-700 dark:text-gold-400">Best Sellers</h2>
            <p className="text-muted-foreground">Our most loved pieces</p>
          </div>
          <Link href="/category/best-sellers">
            <Button variant="outline" data-testid="button-view-all-bestsellers">
              Shop All
            </Button>
          </Link>
        </div>

        {loadingBestSellers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {bestSellers?.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-light mb-2 text-gold-700 dark:text-gold-400">Shop by Category</h2>
            <p className="text-muted-foreground">Explore our curated collections</p>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories?.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  slug={category.slug}
                  image={categoryImages[category.slug] || category.image || ''}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals Banner */}      <section className="py-16 bg-gold-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="font-serif text-3xl md:text-4xl font-light mb-4">
              New Arrivals Every Week
            </p>
            <p className="text-lg opacity-90 mb-6">
              Be the first to discover our latest designs
            </p>
            <Link href="/category/new-arrivals">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white text-white hover:bg-white hover:text-gold-600 transition-all duration-300"
                data-testid="button-view-new-arrivals"
              >
                View New Arrivals
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
