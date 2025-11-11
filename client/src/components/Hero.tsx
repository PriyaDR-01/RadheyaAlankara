import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import heroImage from '@assets/generated_images/Jewelry_lifestyle_hero_image_616be9a9.png';

export function Hero() {
  return (
  <section className="relative h-[220px] sm:h-[280px] md:h-[480px] lg:h-[540px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      <div className="relative z-10 container mx-auto px-6 text-center md:text-left max-w-2xl">
  <h1 className="font-serif text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-light text-white mb-2 sm:mb-4 md:mb-6 leading-tight">
          Radheya Alankara
        </h1>
  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-2 sm:mb-4 md:mb-8 max-w-xl">
          Discover timeless elegance with our exquisite collection of handcrafted rings, earrings, necklaces, and bracelets.
        </p>
        <Link href="/category/all">
          <Button
            size="sm"
            className="bg-primary/90 backdrop-blur-sm hover:bg-primary border border-primary-border text-base sm:text-lg px-6 sm:px-8"
            data-testid="button-shop-all"
          >
            Shop All
          </Button>
        </Link>
      </div>
    </section>
  );
}
