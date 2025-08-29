-- Create purchase orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'received', 'cancelled')),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  expected_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase order items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase_orders
CREATE POLICY "All users can view purchase orders" 
ON public.purchase_orders 
FOR SELECT 
USING (true);

CREATE POLICY "Admin and managers can insert purchase orders" 
ON public.purchase_orders 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]) AND auth.uid() = user_id);

CREATE POLICY "Admin and managers can update purchase orders" 
ON public.purchase_orders 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- Create policies for purchase_order_items
CREATE POLICY "All users can view purchase order items" 
ON public.purchase_order_items 
FOR SELECT 
USING (true);

CREATE POLICY "Admin and managers can insert purchase order items" 
ON public.purchase_order_items 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Generate PO number function
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TEXT
LANGUAGE sql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('po_sequence')::TEXT, 4, '0');
$function$;

-- Create sequence for PO numbers
CREATE SEQUENCE IF NOT EXISTS po_sequence START 1;
