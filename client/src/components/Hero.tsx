import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import heroImage from '@assets/generated_images/Jewelry_lifestyle_hero_image_616be9a9.png';

export function Hero() {
  return (
    <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      
      <div className="relative z-10 container mx-auto px-6 text-center md:text-left max-w-2xl">
        <h1 className="font-serif text-5xl md:text-7xl font-light text-white mb-6 leading-tight">
          Fine Jewelry
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl">
          Discover timeless elegance with our exquisite collection of handcrafted rings, earrings, necklaces, and bracelets.
        </p>
        <Link href="/category/all">
          <Button
            size="lg"
            className="bg-primary/90 backdrop-blur-sm hover:bg-primary border border-primary-border text-lg px-8"
            data-testid="button-shop-all"
          >
            Shop All
          </Button>
        </Link>
      </div>
    </section>
  );
}
