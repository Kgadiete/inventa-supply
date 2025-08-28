import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X, Package, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  reorder_level: number;
}

export function LowStockAlert() {
  const { user } = useAuth();
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchLowStockProducts();

    // Set up real-time listener
    const channel = supabase
      .channel('low-stock-alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        () => fetchLowStockProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchLowStockProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, current_stock, reorder_level')
        .filter('current_stock', 'lte', 'reorder_level')
        .order('current_stock', { ascending: true });

      if (error) throw error;

      setLowStockProducts(data || []);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    }
  };

  const dismissProduct = (productId: string) => {
    setDismissed(prev => new Set([...prev, productId]));
  };

  const visibleProducts = lowStockProducts.filter(product => !dismissed.has(product.id));

  if (visibleProducts.length === 0) return null;

  return (
    <Alert className="border-warning bg-warning-light mb-6">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertDescription>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-warning">Low Stock Alert</span>
              <Badge variant="secondary" className="bg-warning text-warning-foreground">
                {visibleProducts.length} {visibleProducts.length === 1 ? 'item' : 'items'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 h-6 w-6"
              >
                {collapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
            
            {!collapsed && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  The following products are at or below their reorder level:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {visibleProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between bg-background rounded p-2 border"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Package className="w-4 h-4 text-warning flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.sku} • Stock: {product.current_stock} / Reorder: {product.reorder_level}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissProduct(product.id)}
                        className="p-1 h-6 w-6 flex-shrink-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}