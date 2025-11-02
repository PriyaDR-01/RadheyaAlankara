import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(/attached_assets/generated_images/Jewelry_lifestyle_hero_image_616be9a9.png)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      
      <div className="relative z-10 container mx-auto px-6 text-center md:text-left max-w-2xl">
        <h1 className="font-serif text-5xl md:text-7xl font-light text-white mb-6 leading-tight">
          Radheya Alankara
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl">
          Discover timeless elegance with our exquisite collection of handcrafted rings, earrings, necklaces, and bracelets.
        </p>
        <Link href="/category/all">
          <Button
            size="lg"
            className="bg-gold-600 hover:bg-gold-700 text-white border border-gold-500 text-lg px-8 shadow-lg hover:shadow-xl transition-all duration-300"
            data-testid="button-shop-all"
          >
            Shop All
          </Button>
        </Link>
      </div>
    </section>
  );
}
