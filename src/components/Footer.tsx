import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="py-12 border-t bg-background">
      <div className="container mx-auto px-6">        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/attached_assets/radheyaAlankara-circle.png"
                alt="Radheya Alankara"
                width={36}
                height={36}
                className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded-full"
              />
              <h3 className="font-serif text-xl text-gold-600">Radheya Alankara</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Exquisite craftsmanship. Timeless elegance. Luxury you can treasure forever.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/category/rings"><span className="hover:text-gold-600 cursor-pointer transition-colors">Rings</span></Link></li>
              <li><Link href="/category/earrings"><span className="hover:text-gold-600 cursor-pointer transition-colors">Earrings</span></Link></li>
              <li><Link href="/category/necklaces"><span className="hover:text-gold-600 cursor-pointer transition-colors">Necklaces</span></Link></li>
              <li><Link href="/category/bracelets"><span className="hover:text-gold-600 cursor-pointer transition-colors">Bracelets</span></Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Customer Care</h4>            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/shipping-returns"><span className="hover:text-gold-600 cursor-pointer transition-colors">Shipping & Returns</span></Link></li>
              <li><Link href="/care-instructions"><span className="hover:text-gold-600 cursor-pointer transition-colors">Care Instructions</span></Link></li>
              <li><Link href="/contact-us"><span className="hover:text-gold-600 cursor-pointer transition-colors">Contact Us</span></Link></li>
            </ul>
          </div>
        </div>        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          © 2025 Radheya Alankara. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
