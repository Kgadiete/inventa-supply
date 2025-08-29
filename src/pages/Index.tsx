import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Package, 
  Truck, 
  AlertTriangle,
  Activity,
  BarChart3,
  ShoppingCart,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalSuppliers: number;
  pendingOrders: number;
  recentMovements: number;
}

export default function Index() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalSuppliers: 0,
    pendingOrders: 0,
    recentMovements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const [
        { count: totalProducts },
        { data: lowStockData },
        { count: totalSuppliers },
        { count: pendingOrders },
        { count: recentMovements }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('id, current_stock, reorder_level').filter('current_stock', 'lt', 'reorder_level'),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }),
        supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase
          .from('stock_movements')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      setStats({
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockData?.length || 0,
        totalSuppliers: totalSuppliers || 0,
        pendingOrders: pendingOrders || 0,
        recentMovements: recentMovements || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Welcome to InventoryFlow</h1>
            <p className="text-muted-foreground mb-6">
              Your complete inventory management solution for small and medium businesses
            </p>
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              Sign In to Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your inventory today
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-primary text-white">
          {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">In your inventory</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Registered suppliers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => window.location.href = '/inventory'} 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Package className="w-6 h-6" />
              <span className="text-sm">Manage Inventory</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/suppliers'} 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Truck className="w-6 h-6" />
              <span className="text-sm">View Suppliers</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/purchase-orders'} 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="text-sm">Purchase Orders</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/stock-history'} 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Clock className="w-6 h-6" />
              <span className="text-sm">Stock History</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-success" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Stock movements this week</p>
                  <p className="text-xs text-muted-foreground">{stats.recentMovements} transactions recorded</p>
                </div>
              </div>
              
              {stats.lowStockProducts > 0 && (
                <div className="flex items-center gap-3 p-3 bg-warning-light rounded-lg">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Low stock alert</p>
                    <p className="text-xs text-muted-foreground">{stats.lowStockProducts} items need attention</p>
                  </div>
                </div>
              )}
              
              {stats.pendingOrders > 0 && (
                <div className="flex items-center gap-3 p-3 bg-primary-light rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Orders pending</p>
                    <p className="text-xs text-muted-foreground">{stats.pendingOrders} purchase orders awaiting delivery</p>
                  </div>
                </div>
              )}
              
              {stats.recentMovements === 0 && stats.lowStockProducts === 0 && stats.pendingOrders === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>All systems running smoothly!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>InventoryFlow Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-subtle rounded-lg">
              <Package className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Smart Inventory Management</h3>
              <p className="text-sm text-muted-foreground">
                Track stock levels, set reorder points, and get automated low-stock alerts
              </p>
            </div>
            
            <div className="p-4 bg-gradient-subtle rounded-lg">
              <Truck className="w-8 h-8 text-success mb-3" />
              <h3 className="font-semibold mb-2">Supplier Network</h3>
              <p className="text-sm text-muted-foreground">
                Manage supplier relationships, track quotes, and streamline procurement
              </p>
            </div>
            
            <div className="p-4 bg-gradient-subtle rounded-lg">
              <BarChart3 className="w-8 h-8 text-warning mb-3" />
              <h3 className="font-semibold mb-2">Analytics & Reporting</h3>
              <p className="text-sm text-muted-foreground">
                Get insights into stock movements, supplier performance, and trends
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}