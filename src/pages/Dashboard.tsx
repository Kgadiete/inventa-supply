import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  Package, 
  Truck, 
  AlertTriangle,
  Activity,
  BarChart3,
  ShoppingCart,
  Clock,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalSuppliers: number;
  pendingOrders: number;
  recentMovements: number;
  totalOrderValue: number;
  totalUsers: number;
}

interface RecentMovement {
  id: string;
  type: 'in' | 'out';
  quantity: number;
  created_at: string;
  products: { name: string };
  profiles: { name: string };
}

interface LowStockProduct {
  id: string;
  name: string;
  current_stock: number;
  reorder_level: number;
  category: string;
}

interface RecentPurchaseOrder {
  id: string;
  po_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  suppliers: { name: string } | null;
  profiles: { name: string } | null;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalSuppliers: 0,
    pendingOrders: 0,
    recentMovements: 0,
    totalOrderValue: 0,
    totalUsers: 0,
  });
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentPurchaseOrders, setRecentPurchaseOrders] = useState<RecentPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    if (user && profile) {
      fetchDashboardData();

      // Set up real-time listeners for dashboard data
      const purchaseOrdersChannel = supabase
        .channel('dashboard-purchase-orders')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'purchase_orders' },
          () => fetchDashboardData()
        )
        .subscribe();

      const stockMovementsChannel = supabase
        .channel('dashboard-stock-movements')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'stock_movements' },
          () => fetchDashboardData()
        )
        .subscribe();

      const productsChannel = supabase
        .channel('dashboard-products')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => fetchDashboardData()
        )
        .subscribe();

      const suppliersChannel = supabase
        .channel('dashboard-suppliers')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'suppliers' },
          () => fetchDashboardData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(purchaseOrdersChannel);
        supabase.removeChannel(stockMovementsChannel);
        supabase.removeChannel(productsChannel);
        supabase.removeChannel(suppliersChannel);
      };
    }
  }, [user, profile]);

  const fetchDashboardData = async () => {
    try {
      const [
        { count: totalProducts },
        { data: lowStockData },
        { count: totalSuppliers },
        { count: pendingOrders },
        { count: recentMovements },
        { data: orderData },
        { count: totalUsers },
        { data: movementsData },
        { data: purchaseOrdersData }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('id, name, current_stock, reorder_level, category').filter('current_stock', 'lt', 'reorder_level').limit(5),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }),
        supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase
          .from('stock_movements')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('purchase_orders').select('total_amount'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('stock_movements')
          .select(`
            id,
            type,
            quantity,
            created_at,
            products (name),
            profiles (name)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('purchase_orders')
          .select(`
            id,
            po_number,
            status,
            total_amount,
            created_at,
            suppliers (name),
            profiles (name)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const totalOrderValue = orderData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      setStats({
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockData?.length || 0,
        totalSuppliers: totalSuppliers || 0,
        pendingOrders: pendingOrders || 0,
        recentMovements: recentMovements || 0,
        totalOrderValue,
        totalUsers: totalUsers || 0,
      });

      setLowStockProducts(lowStockData || []);
      setRecentMovements(movementsData || []);
      setRecentPurchaseOrders(purchaseOrdersData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-3 text-muted-foreground">
            {!profile ? 'Loading user profile...' : 'Loading dashboard data...'}
          </p>
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
            Overview of your inventory management system
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-primary text-white">
          {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <p className="text-xs text-success">Active inventory</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">Items need reordering</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Total purchase orders</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentMovements}</div>
            <p className="text-xs text-muted-foreground">Stock movements</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Registered suppliers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock Movements */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Stock Movements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMovements.length > 0 ? (
              <div className="space-y-3">
                {recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      {movement.type === 'in' ? (
                        <TrendingUp className="w-4 h-4 text-success" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-danger" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{movement.products.name}</p>
                        <p className="text-xs text-muted-foreground">
                          by {movement.profiles.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${movement.type === 'in' ? 'text-success' : 'text-danger'}`}>
                        {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-muted-foreground">
                No recent stock movements
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Reorder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-warning text-warning-foreground">
                          {product.current_stock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {product.reorder_level}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6">
                <Package className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">All products are well stocked!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchase Orders */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Recent Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPurchaseOrders.length > 0 ? (
            <div className="space-y-3">
              {recentPurchaseOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{order.po_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.suppliers?.name || 'Unknown Supplier'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(order.total_amount)}</p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={
                          order.status === 'pending' ? 'bg-warning text-warning-foreground' :
                          order.status === 'approved' ? 'bg-primary text-primary-foreground' :
                          order.status === 'sent' ? 'bg-blue-500 text-white' :
                          order.status === 'received' ? 'bg-success text-success-foreground' :
                          'bg-destructive text-destructive-foreground'
                        }
                      >
                        {order.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">
              No recent purchase orders
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => window.location.href = '/inventory'} 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Package className="w-6 h-6" />
              <span className="text-sm">Manage Products</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/suppliers'} 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-success hover:text-success-foreground transition-colors"
            >
              <Truck className="w-6 h-6" />
              <span className="text-sm">View Suppliers</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/purchase-orders'} 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-warning hover:text-warning-foreground transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="text-sm">Purchase Orders</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/stock-history'} 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted hover:text-muted-foreground transition-colors"
            >
              <Clock className="w-6 h-6" />
              <span className="text-sm">View History</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}