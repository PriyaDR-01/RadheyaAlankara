import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="py-12 border-t bg-background">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-serif text-xl mb-4">Fine Jewelry</h3>
            <p className="text-sm text-muted-foreground">
              Exquisite craftsmanship. Timeless elegance. Luxury you can treasure forever.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/category/rings" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Rings</span></Link></li>
              <li><Link href="/category/earrings" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Earrings</span></Link></li>
              <li><Link href="/category/necklaces" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Necklaces</span></Link></li>
              <li><Link href="/category/bracelets" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Bracelets</span></Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Customer Care</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/shipping-returns" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Shipping & Returns</span></Link></li>
              <li><Link href="/care-instructions" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Care Instructions</span></Link></li>
              <li><Link href="/contact-us" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="hover:text-foreground cursor-pointer">Contact Us</span></Link></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          © 2025 Fine Jewelry. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
