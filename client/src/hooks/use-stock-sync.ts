import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to periodically sync stock data across the application
 * This ensures that product stock is updated in real-time across different screens/devices
 */
export function useStockSync(intervalMs: number = 30000) { // Default: 30 seconds
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const syncStock = () => {
      // Invalidate all product-related queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/slug'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/category'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/best-sellers'] });
      
      console.log('🔄 Stock data synchronized');
    };

    // Set up interval for periodic sync
    intervalRef.current = setInterval(syncStock, intervalMs);

    // Also sync when the tab becomes visible (user switches back to the tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncStock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient, intervalMs]);

  // Manual sync function that can be called from components
  const syncNow = async () => {
    console.log('🔄 Force syncing stock data...');
    
    // First, force server to refresh products from file
    try {
      await fetch('/api/products/refresh', { method: 'POST' });
    } catch (error) {
      console.warn('Failed to refresh server products:', error);
    }
    
    // Then invalidate all client queries
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products/slug'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products/category'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products/best-sellers'] });
    
    // Force refetch immediately
    await queryClient.refetchQueries({ queryKey: ['/api/products'] });
    
    console.log('✅ Stock data force synced');
  };

  return { syncNow };
}