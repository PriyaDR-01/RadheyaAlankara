import React from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { CategoryManagement } from '@/components/admin/CategoryManagement';
import { Shield, Package, ShoppingCart, Folder } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Admin() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Scroll to top when admin panel is accessed
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Check if user is admin (you can modify this logic based on your auth system)
  React.useEffect(() => {
    if (!user || user.email !== 'admin@radheyaalankara.com') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.email !== 'admin@radheyaalankara.com') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light leading-tight">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Manage products, categories, and orders for Radheya Alankara
          </p>
        </div>

        {/* Tabs Section - Responsive */}
        <Tabs defaultValue="products" className="space-y-4 sm:space-y-6">
          {/* Tab Navigation - Responsive */}
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10 gap-1 sm:gap-0 p-1">
            <TabsTrigger 
              value="categories" 
              className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-1.5 px-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Folder className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">Category Management</span>
              <span className="xs:hidden sm:hidden">Categories</span>
            </TabsTrigger>
            <TabsTrigger 
              value="products" 
              className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-1.5 px-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">Product Management</span>
              <span className="xs:hidden sm:hidden">Products</span>
            </TabsTrigger>            
            <TabsTrigger 
              value="orders" 
              className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-1.5 px-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">Order Management</span>
              <span className="xs:hidden sm:hidden">Orders</span>
            </TabsTrigger>
          </TabsList>

           {/* Category Management Tab */}
          <TabsContent value="categories" className="space-y-0">
            <Card className="border-0 sm:border shadow-sm sm:shadow-md">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-6 bg-gradient-to-r from-purple-50 to-violet-50 border-b">
                <div className="space-y-2">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <Folder className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" />
                    <span>Category Management</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Create and manage jewelry categories with custom images. Organize your products into meaningful collections.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 lg:p-6">
                <div className="w-full overflow-hidden">
                  <CategoryManagement />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product Management Tab */}
          <TabsContent value="products" className="space-y-0">
            <Card className="border-0 sm:border shadow-sm sm:shadow-md">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="space-y-2">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                    <span>Product Management</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Add, edit, and manage products in the jewelry collection. Upload images, set prices, and organize by categories.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 lg:p-6">
                <div className="w-full overflow-hidden">
                  <ProductManagement />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Management Tab */}
          <TabsContent value="orders" className="space-y-0">
            <Card className="border-0 sm:border shadow-sm sm:shadow-md">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <div className="space-y-2">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                    <span>Order Management</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    View customer orders, update order status, manage tracking information, and handle fulfillment processes.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 lg:p-6">
                <div className="w-full overflow-hidden">
                  <OrderManagement />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
