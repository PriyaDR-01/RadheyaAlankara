import { ShoppingBag, Menu, LogIn } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import React from 'react';
import { useAuth } from '@/lib/auth';
import RegisterModal from './RegisterModal';
import LoginModal from './LoginModal';
import circularLogo from '@/assets/radheyaAlankara-circle.png';

const categories = [
  { name: 'Rings', slug: 'rings' },
  { name: 'Earrings', slug: 'earrings' },
  { name: 'Necklaces', slug: 'necklaces' },
  { name: 'Bracelets', slug: 'bracelets' },
];

export function Header() {
  const { itemCount, openCart } = useCart();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const [showRegister, setShowRegister] = React.useState(false);
  const [showLogin, setShowLogin] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link href="/" data-testid="link-home">
            <span className="flex items-center gap-3 hover-elevate active-elevate-2 rounded-md px-3 py-2 -ml-3 cursor-pointer">
              <img
                src={circularLogo}
                alt="Radheya Alankara"
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 object-cover rounded-full"
              />
              <h1 className="font-serif text-xl sm:text-2xl md:text-2xl lg:text-3xl font-light tracking-wide">Radheya Alankara</h1>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className="font-sans text-sm"
                    data-testid="button-categories"
                  >
                    Categories
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-64 gap-2 p-4">
                      {categories.map((category) => (
                        <li key={category.slug}>
                          <Link href={`/category/${category.slug}`} onClick={e => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                            <span 
                              className="block select-none rounded-md p-3 hover-elevate active-elevate-2 cursor-pointer"
                              data-testid={`link-category-${category.slug}`}
                            >
                              <div className="text-sm font-medium">{category.name}</div>
                              <p className="text-sm text-muted-foreground">
                                Explore our {category.name.toLowerCase()} collection
                              </p>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link href="/category/best-sellers" onClick={e => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <span className="text-sm hover-elevate active-elevate-2 rounded-md px-3 py-2 cursor-pointer" data-testid="link-best-sellers">
                Best Sellers
              </span>
            </Link>

            <Link href="/category/new-arrivals" onClick={e => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <span className="text-sm hover-elevate active-elevate-2 rounded-md px-3 py-2 cursor-pointer" data-testid="link-new-arrivals">
                New Arrivals
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm mr-2">Hello, {user.name}</span>
                <Button variant="outline" size="sm" onClick={logout} data-testid="button-logout">Logout</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={() => setShowLogin(true)} data-testid="button-login-icon">
                  <LogIn className="h-5 w-5" />
                </Button>
              </>
            )}
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} onShowRegister={() => { setShowLogin(false); setShowRegister(true); }} />}
            {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
            <Button
              variant="ghost"
              size="icon"
              onClick={openCart}
              className="relative"
              data-testid="button-open-cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="text-cart-count"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <nav className="flex flex-col gap-2 p-6">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                    <span className="flex items-center gap-2 font-serif text-lg sm:text-xl mb-4">
                      <img
                        src={circularLogo}
                        alt="Radheya Alankara"
                        className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded-full"
                      />
                      Radheya Alankara
                    </span>
                  </Link>
                  <div className="border-b my-2" />
                  <ul className="flex flex-col gap-1">
                    {categories.map((category) => (
                      <li key={category.slug}>
                        <Link href={`/category/${category.slug}`} onClick={e => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                          <span className="block rounded-md px-2 py-2 hover:bg-muted" data-testid={`mobile-link-category-${category.slug}`}>{category.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/category/best-sellers" onClick={e => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    <span className="block rounded-md px-2 py-2 hover:bg-muted" data-testid="mobile-link-best-sellers">Best Sellers</span>
                  </Link>
                  <Link href="/category/new-arrivals" onClick={e => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    <span className="block rounded-md px-2 py-2 hover:bg-muted" data-testid="mobile-link-new-arrivals">New Arrivals</span>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
