import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  totalSuppliers: number;
  recentMovements: number;
}

interface Product {
  id: string;
  name: string;
  current_stock: number;
  reorder_level: number;
  category: string;
}

interface StockMovement {
  id: string;
  type: 'in' | 'out';
  quantity: number;
  created_at: string;
  products: { name: string };
  profiles: { name: string };
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockCount: 0,
    totalSuppliers: 0,
    recentMovements: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentActivity, setRecentActivity] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time listeners
    const productsChannel = supabase
      .channel('dashboard-products')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        () => fetchDashboardData()
      )
      .subscribe();

    const movementsChannel = supabase
      .channel('dashboard-movements')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stock_movements' },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(movementsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch products and calculate stats
      const { data: products } = await supabase
        .from('products')
        .select('*');

      // Fetch suppliers count
      const { count: suppliersCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true });

      // Fetch recent movements count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: movementsCount } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Calculate low stock products
      const lowStock = products?.filter(p => p.current_stock <= p.reorder_level) || [];

      setStats({
        totalProducts: products?.length || 0,
        lowStockCount: lowStock.length,
        totalSuppliers: suppliersCount || 0,
        recentMovements: movementsCount || 0,
      });

      setLowStockProducts(lowStock.slice(0, 5)); // Show top 5

      // Fetch recent activity
      const { data: movements } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products (name),
          profiles (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(movements || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.name}! Here's your inventory overview.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Items in inventory</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Active suppliers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentMovements}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground">All products are well stocked! 🎉</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-warning-light rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-warning text-warning-foreground">
                        {product.current_stock} left
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reorder at {product.reorder_level}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((movement) => (
                  <div key={movement.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                    <div className={`p-2 rounded-full ${
                      movement.type === 'in' ? 'bg-success-light' : 'bg-danger-light'
                    }`}>
                      {movement.type === 'in' ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-danger" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{movement.products.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {movement.type === 'in' ? 'Added' : 'Removed'} {movement.quantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {movement.profiles.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}