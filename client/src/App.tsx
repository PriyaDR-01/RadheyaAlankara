import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { useStockSync } from "@/hooks/use-stock-sync";
import { Header } from "@/components/Header";
import { ShoppingCart } from "@/components/ShoppingCart";
import Footer from "./components/Footer";
import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import CategoryPage from "@/pages/CategoryPage";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import NotFound from "@/pages/not-found";
import ShippingReturns from "@/pages/ShippingReturns";
import CareInstructions from "@/pages/CareInstructions";
import ContactUs from "@/pages/ContactUs";
import Admin from "@/pages/Admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-success" component={OrderSuccess} />      <Route path="/shipping-returns" component={ShippingReturns} />
      <Route path="/care-instructions" component={CareInstructions} />
      <Route path="/contact-us" component={ContactUs} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  // Enable stock synchronization across the app
  useStockSync(30000); // Sync every 30 seconds

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
      <ShoppingCart />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <Toaster />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
