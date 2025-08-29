-- Add missing foreign key constraints for purchase_orders table
-- This fixes the 400 error when trying to join with suppliers and profiles tables

-- Add foreign key constraint for supplier_id
ALTER TABLE public.purchase_orders 
ADD CONSTRAINT fk_purchase_orders_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;

-- Add foreign key constraint for user_id
ALTER TABLE public.purchase_orders 
ADD CONSTRAINT fk_purchase_orders_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- Add foreign key constraint for purchase_order_items
ALTER TABLE public.purchase_order_items 
ADD CONSTRAINT fk_purchase_order_items_purchase_order_id 
FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;

-- Add foreign key constraint for product_id in purchase_order_items
ALTER TABLE public.purchase_order_items 
ADD CONSTRAINT fk_purchase_order_items_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
