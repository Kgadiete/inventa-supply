import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CSVImporterProps {
  type: 'products' | 'suppliers';
  onImportComplete: () => void;
}

export function CSVImporter({ type, onImportComplete }: CSVImporterProps) {
  const { canModify } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  if (!canModify) return null;

  const downloadTemplate = () => {
    const headers = type === 'products' 
      ? ['name', 'sku', 'category', 'reorder_level', 'unit_price']
      : ['name', 'email', 'phone', 'address', 'product_types', 'rating'];
    
    const template = type === 'products'
      ? 'Sample Product,SKU001,Electronics,10,25.99'
      : 'Sample Supplier,supplier@email.com,+1234567890,123 Main St,Electronics;Hardware,5';

    const csvContent = `${headers.join(',')}\n${template}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    return rows;
  };

  const validateRow = (row: any) => {
    if (type === 'products') {
      if (!row.name || !row.sku || !row.category) {
        return 'Missing required fields: name, sku, category';
      }
      if (isNaN(Number(row.reorder_level)) || isNaN(Number(row.unit_price))) {
        return 'reorder_level and unit_price must be numbers';
      }
    } else {
      if (!row.name) {
        return 'Missing required field: name';
      }
      if (row.rating && (isNaN(Number(row.rating)) || Number(row.rating) < 1 || Number(row.rating) > 5)) {
        return 'Rating must be a number between 1 and 5';
      }
    }
    return null;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      const validRows = [];
      const errors = [];

      for (const [index, row] of rows.entries()) {
        const error = validateRow(row);
        if (error) {
          errors.push(`Row ${index + 2}: ${error}`);
        } else {
          validRows.push(row);
        }
      }

      if (validRows.length === 0) {
        setResults({ success: 0, errors });
        return;
      }

      // Process valid rows
      const batchSize = 10;
      let successCount = 0;

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        const processedBatch = batch.map(row => {
          if (type === 'products') {
            return {
              name: row.name,
              sku: row.sku,
              category: row.category,
              reorder_level: parseInt(row.reorder_level),
              unit_price: parseFloat(row.unit_price),
            };
          } else {
            return {
              name: row.name,
              contact_info: {
                email: row.email || '',
                phone: row.phone || '',
                address: row.address || '',
              },
              product_types: row.product_types ? row.product_types.split(';').map((t: string) => t.trim()) : [],
              rating: row.rating ? parseInt(row.rating) : null,
            };
          }
        });

        const { error } = await supabase
          .from(type)
          .insert(processedBatch);

        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
        }

        setProgress(((i + batchSize) / validRows.length) * 100);
      }

      setResults({ success: successCount, errors });

      if (successCount > 0) {
        toast({
          title: 'Import completed',
          description: `Successfully imported ${successCount} ${type}`,
        });
        onImportComplete();
      }

    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Import {type === 'products' ? 'Products' : 'Suppliers'} from CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          
          <div className="flex-1">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>
        </div>

        {importing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Importing...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {results && (
          <Alert className={results.success > 0 ? "border-success" : "border-destructive"}>
            {results.success > 0 ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                {results.success > 0 && (
                  <p className="text-success">Successfully imported {results.success} records.</p>
                )}
                {results.errors.length > 0 && (
                  <div>
                    <p className="text-destructive font-medium">Errors:</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-4 max-h-32 overflow-y-auto">
                      {results.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleImport}
          disabled={!file || importing}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          <Upload className="w-4 h-4 mr-2" />
          {importing ? 'Importing...' : 'Import CSV'}
        </Button>
      </CardContent>
    </Card>
  );
}