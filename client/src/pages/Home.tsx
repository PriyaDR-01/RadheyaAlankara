import { useQuery } from '@tanstack/react-query';
import { Product, Category } from '@shared/schema';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import ringsImage from '@assets/generated_images/Gold_rings_lifestyle_banner_c5c6d06b.png';
import earringsImage from '@assets/generated_images/Gold_loop_hoop_earrings_c6e47118.png';
import necklaceImage from '@assets/generated_images/Gold_collar_necklace_ecf1d78f.png';
import braceletImage from '@assets/generated_images/Gold_wave_bangle_bracelet_8bbe3a36.png';

const categoryImages: Record<string, string> = {
  rings: ringsImage,
  earrings: earringsImage,
  necklaces: necklaceImage,
  bracelets: braceletImage,
};

export default function Home() {
  const { data: bestsellers, isLoading: loadingBestSellers } = useQuery<Product[]>({
    queryKey: ['/api/products/category/best-sellers'],
  });

  const { data: categories, isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  return (
    <div className="min-h-screen">
  
      <Hero />

      {/* Moving Banner (CSS Animation) */}
      <div className="w-full bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 py-2 border-b border-yellow-300 overflow-hidden">
        <div className="whitespace-nowrap animate-scroll-banner text-lg font-semibold text-pink-700">
          <span className="mx-8">🎉 Free Shipping on All Orders!</span>
          <span className="mx-8">Shop the Latest Festive Collection</span>
          <span className="mx-8">Fast Delivery &amp; Easy Returns!</span>
        </div>
      </div>

      {/* Best Sellers Section */}
      {bestsellers && bestsellers.length > 0 && (
        <section className="py-20 container mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="font-serif text-4xl font-light mb-2">Best Sellers</h2>
              <p className="text-muted-foreground">Our most popular picks</p>
            </div>
            <Link href="/category/best-sellers">
              <Button variant="outline" data-testid="button-view-all-best-sellers">
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
              {bestsellers?.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-light mb-2">Shop by Category</h2>
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

      {/* Best Sellers Banner */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="font-serif text-3xl md:text-4xl font-light mb-4 animate-pulse">
              Best Sellers This Season
            </p>
            <p className="text-lg opacity-90 mb-6">
              Discover our most loved designs
            </p>
            <Link href="/category/best-sellers">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                data-testid="button-view-best-sellers"
              >
                View Best Sellers
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
