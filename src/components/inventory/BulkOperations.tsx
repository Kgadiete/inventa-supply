import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square, TrendingUp, TrendingDown, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
}

interface BulkOperationsProps {
  products: Product[];
  onOperationComplete: () => void;
}

export function BulkOperations({ products, onOperationComplete }: BulkOperationsProps) {
  const { canModify, profile } = useAuth();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<'stock-in' | 'stock-out' | null>(null);
  const [processing, setProcessing] = useState(false);

  if (!canModify || products.length === 0) return null;

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const openBulkDialog = (action: 'stock-in' | 'stock-out') => {
    if (selectedProducts.size === 0) {
      toast({
        title: 'No products selected',
        description: 'Please select products first',
        variant: 'destructive',
      });
      return;
    }
    setBulkAction(action);
    setShowBulkDialog(true);
  };

  const handleBulkOperation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bulkAction || !profile) return;

    setProcessing(true);

    const formData = new FormData(e.currentTarget);
    const quantity = parseInt(formData.get('quantity') as string);
    const notes = formData.get('notes') as string;

    try {
      const movements = Array.from(selectedProducts).map(productId => ({
        product_id: productId,
        type: (bulkAction === 'stock-in' ? 'in' : 'out') as 'in' | 'out',
        quantity,
        notes,
        user_id: profile.id,
      }));

      const { error } = await supabase
        .from('stock_movements')
        .insert(movements);

      if (error) throw error;

      toast({
        title: 'Bulk operation completed',
        description: `Updated stock for ${selectedProducts.size} products`,
      });

      setShowBulkDialog(false);
      setSelectedProducts(new Set());
      setBulkAction(null);
      onOperationComplete();
    } catch (error: any) {
      toast({
        title: 'Bulk operation failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const selectedProductsList = products.filter(p => selectedProducts.has(p.id));

  return (
    <>
      <div className="bg-secondary/50 rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="flex items-center gap-2"
            >
              {selectedProducts.size === products.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedProducts.size === products.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedProducts.size > 0 && (
              <Badge variant="secondary">
                {selectedProducts.size} selected
              </Badge>
            )}
          </div>

          {selectedProducts.size > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openBulkDialog('stock-in')}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4 text-success" />
                Add Stock
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openBulkDialog('stock-out')}
                className="flex items-center gap-2"
              >
                <TrendingDown className="w-4 h-4 text-danger" />
                Remove Stock
              </Button>
            </div>
          )}
        </div>

        {selectedProducts.size > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedProductsList.map(product => (
              <Badge
                key={product.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {product.name} ({product.sku})
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => toggleProduct(product.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bulk {bulkAction === 'stock-in' ? 'Add' : 'Remove'} Stock
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBulkOperation} className="space-y-4">
            <div className="space-y-2">
              <Label>Selected Products ({selectedProducts.size})</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 bg-secondary">
                {selectedProductsList.map(product => (
                  <div key={product.id} className="flex justify-between text-sm py-1">
                    <span>{product.name}</span>
                    <span className="text-muted-foreground">Current: {product.current_stock}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" min="1" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" name="notes" placeholder="Reason for bulk operation" />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBulkDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processing}
                className="flex-1"
              >
                {processing ? 'Processing...' : `${bulkAction === 'stock-in' ? 'Add' : 'Remove'} Stock`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ProductRowProps {
  product: Product;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export function ProductRow({ product, isSelected, onToggle }: ProductRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(product.id)}
        className="p-1"
      >
        {isSelected ? (
          <CheckSquare className="w-4 h-4 text-primary" />
        ) : (
          <Square className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}