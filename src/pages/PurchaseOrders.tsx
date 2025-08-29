import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  FileText, 
  Download,
  Calendar,
  DollarSign,
  Truck,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PurchaseOrder {
  id: string;
  po_number: string;
  status: string;
  total_amount: number;
  notes: string | null;
  expected_delivery: string | null;
  created_at: string;
  suppliers: {
    name: string;
  } | null;
  profiles: {
    name: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
  unit_price: number;
}

interface Supplier {
  id: string;
  name: string;
}

export default function PurchaseOrders() {
  const { canModify, profile } = useAuth();
  const { toast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [orderItems, setOrderItems] = useState<Array<{ product_id: string; quantity: number; unit_price: number }>>([
    { product_id: '', quantity: 1, unit_price: 0 }
  ]);

  useEffect(() => {
    fetchData();

    // Set up real-time listener
    const channel = supabase
      .channel('purchase-orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'purchase_orders' },
        () => fetchPurchaseOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterOrders();
  }, [purchaseOrders, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchPurchaseOrders(),
        fetchProducts(),
        fetchSuppliers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers (name),
        profiles (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setPurchaseOrders((data as any) || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, unit_price')
      .order('name');

    if (error) throw error;
    setProducts(data || []);
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name')
      .order('name');

    if (error) throw error;
    setSuppliers(data || []);
  };

  const filterOrders = () => {
    let filtered = purchaseOrders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.suppliers?.name && order.suppliers.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      updated[index] = {
        ...updated[index],
        [field]: value,
        unit_price: product?.unit_price || 0
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  const handleCreatePO = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canModify || !profile) return;

    const formData = new FormData(e.currentTarget);
    
    try {
      // Generate PO number
      const { data: poNumberData, error: poNumberError } = await supabase
        .rpc('generate_po_number');

      if (poNumberError) throw poNumberError;

      const poData = {
        po_number: poNumberData,
        supplier_id: formData.get('supplier_id') as string,
        user_id: profile.id,
        total_amount: calculateTotal(),
        notes: formData.get('notes') as string,
        expected_delivery: formData.get('expected_delivery') as string || null,
      };

      const { data: poResult, error: poError } = await supabase
        .from('purchase_orders')
        .insert([poData])
        .select()
        .single();

      if (poError) throw poError;

      // Insert order items
      const validItems = orderItems.filter(item => item.product_id && item.quantity > 0);
      const itemsData = validItems.map(item => ({
        purchase_order_id: poResult.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      toast({
        title: 'Purchase order created',
        description: `PO ${poData.po_number} has been created successfully`,
      });

      setShowCreateDialog(false);
      setOrderItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const exportPO = (po: PurchaseOrder) => {
    // Simple CSV export - in a real app, you'd generate a proper PDF
    const csvContent = `Purchase Order: ${po.po_number}\nSupplier: ${po.suppliers?.name || 'Unknown'}\nTotal: $${po.total_amount.toFixed(2)}\nStatus: ${po.status}\nCreated: ${new Date(po.created_at).toLocaleDateString()}`;
    
    const blob = new Blob([csvContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PO_${po.po_number}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'approved': return 'bg-primary text-primary-foreground';
      case 'sent': return 'bg-blue-500 text-white';
      case 'received': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage purchase orders and supplier requests
          </p>
        </div>
        {canModify && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Create PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Purchase Order</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePO} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Supplier</Label>
                    <Select name="supplier_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected_delivery">Expected Delivery</Label>
                    <Input id="expected_delivery" name="expected_delivery" type="date" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Order Items</Label>
                    <Button type="button" onClick={addOrderItem} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  
                  {orderItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded">
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Select 
                          value={item.product_id} 
                          onValueChange={(value) => updateOrderItem(index, 'product_id', value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={`$${(item.quantity * item.unit_price).toFixed(2)}`}
                            disabled
                          />
                          {orderItems.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOrderItem(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Additional notes or requirements" />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary rounded">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                </div>

                <Button type="submit" className="w-full">Create Purchase Order</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search purchase orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Purchase Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="hidden md:table-cell">Expected Delivery</TableHead>
                  <TableHead className="hidden lg:table-cell">Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.po_number}</TableCell>
                    <TableCell>{order.suppliers?.name || 'Unknown'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {order.expected_delivery 
                        ? new Date(order.expected_delivery).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {order.profiles?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportPO(order)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}