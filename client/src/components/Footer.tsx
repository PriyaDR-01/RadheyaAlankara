import { Link } from 'wouter';
import circularLogo from '@/assets/radheyaAlankara-circle.png';

export default function Footer() {
  return (
    <footer className="py-12 border-t bg-background">
      <div className="container mx-auto px-6">

        <div className="flex flex-col md:flex-row md:justify-center gap-8 md:gap-16 mb-8">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
              <img
                src={circularLogo}
                alt="Radheya Alankara"
                className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded-full"
              />
              <h3 className="font-serif text-xl">Radheya Alankara</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto md:mx-0">
              Exquisite craftsmanship. Timeless elegance. Luxury you can treasure forever.
            </p>
          </div>

          {/* <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground w-max mx-auto md:mx-0">
              <li><Link href="/category/rings" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Rings</span></Link></li>
              <li><Link href="/category/earrings" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Earrings</span></Link></li>
              <li><Link href="/category/necklaces" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Necklaces</span></Link></li>
              <li><Link href="/category/bracelets" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Bracelets</span></Link></li>
            </ul>
          </div> */}

          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">Customer Care</h4>
            <ul className="space-y-2 text-sm text-muted-foreground w-max mx-auto md:mx-0">
              <li><Link href="/shipping-returns" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Shipping & Returns</span></Link></li>
              <li><Link href="/care-instructions" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Care Instructions</span></Link></li>
              <li><Link href="/contact-us" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Contact Us</span></Link></li>
            </ul>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          © 2025 Radheya Alankara. All rights reserved.
        </div>
      </div>
    </footer>
  );
}