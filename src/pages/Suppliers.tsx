import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Star,
  Truck,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Supplier {
  id: string;
  name: string;
  contact_info: any; // JSONB field from Supabase
  product_types: string[];
  rating: number | null;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
}

interface SupplierQuote {
  id: string;
  price: number;
  created_at: string;
  products: { name: string };
  suppliers: { name: string };
  profiles: { name: string };
}

export default function Suppliers() {
  const { canModify, profile } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<SupplierQuote[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Set up real-time listeners
    const suppliersChannel = supabase
      .channel('suppliers-data')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'suppliers' },
        () => fetchData()
      )
      .subscribe();

    const quotesChannel = supabase
      .channel('quotes-data')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'supplier_quotes' },
        () => fetchQuotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(suppliersChannel);
      supabase.removeChannel(quotesChannel);
    };
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchTerm]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchSuppliers(),
        fetchProducts(),
        fetchQuotes()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) throw error;
    setSuppliers(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .order('name');

    if (error) throw error;
    setProducts(data || []);
  };

  const fetchQuotes = async () => {
    const { data, error } = await supabase
      .from('supplier_quotes')
      .select(`
        *,
        products (name),
        suppliers (name),
        profiles (name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    setQuotes(data || []);
  };

  const filterSuppliers = () => {
    let filtered = suppliers;

    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.product_types.some(type => 
          type.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredSuppliers(filtered);
  };

  const handleAddSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canModify) return;

    const formData = new FormData(e.currentTarget);
    const supplierData = {
      name: formData.get('name') as string,
      contact_info: {
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
      },
      product_types: (formData.get('product_types') as string).split(',').map(t => t.trim()),
      rating: parseInt(formData.get('rating') as string) || null,
    };

    try {
      const { error } = await supabase
        .from('suppliers')
        .insert([supplierData]);

      if (error) throw error;

      toast({
        title: 'Supplier added',
        description: `${supplierData.name} has been added successfully`,
      });

      setShowAddDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddQuote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canModify || !profile) return;

    const formData = new FormData(e.currentTarget);
    const quoteData = {
      product_id: formData.get('product_id') as string,
      supplier_id: formData.get('supplier_id') as string,
      price: parseFloat(formData.get('price') as string),
      user_id: profile.id,
    };

    try {
      const { error } = await supabase
        .from('supplier_quotes')
        .insert([quoteData]);

      if (error) throw error;

      toast({
        title: 'Quote added',
        description: 'Supplier quote has been recorded successfully',
      });

      setShowQuoteDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground">No rating</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-warning fill-current' 
                : 'text-muted-foreground'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-foreground">Supplier Management</h1>
          <p className="text-muted-foreground">
            Manage your suppliers and track quotes
          </p>
        </div>
        {canModify && (
          <div className="flex gap-2">
            <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Quote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Supplier Quote</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddQuote} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_id">Product</Label>
                    <Select name="product_id" required>
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
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" name="price" type="number" step="0.01" min="0" required />
                  </div>
                  <Button type="submit" className="w-full">Add Quote</Button>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSupplier} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Supplier Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" name="address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product_types">Product Types (comma-separated)</Label>
                    <Input id="product_types" name="product_types" placeholder="Electronics, Hardware, Software" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Select name="rating">
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Star</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="5">5 Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Add Supplier</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Suppliers ({filteredSuppliers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="p-4 bg-secondary rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{supplier.name}</h3>
                    {renderStars(supplier.rating)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {supplier.contact_info.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {supplier.contact_info.email}
                      </div>
                    )}
                    {supplier.contact_info.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {supplier.contact_info.phone}
                      </div>
                    )}
                    {supplier.contact_info.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {supplier.contact_info.address}
                      </div>
                    )}
                  </div>
                  
                  {supplier.product_types.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {supplier.product_types.map((type, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredSuppliers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No suppliers found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Quotes */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Recent Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quotes.map((quote) => (
                <div key={quote.id} className="p-3 bg-secondary rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{quote.products.name}</p>
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      ${quote.price.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    From: {quote.suppliers.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added by {quote.profiles.name} • {new Date(quote.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {quotes.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No quotes recorded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}