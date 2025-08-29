-- Multi-Tenancy Migration
-- This migration adds company isolation and hierarchical user management

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    max_users INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a default company for existing users FIRST
INSERT INTO public.companies (id, name, industry, size, subscription_plan, max_users)
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Company', 'Technology', 'Small', 'free', 50)
ON CONFLICT (id) DO NOTHING;

-- Create departments table AFTER company exists
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_predefined BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Insert predefined departments AFTER company and table exist
INSERT INTO public.departments (company_id, name, description, is_predefined) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Warehouse', 'Inventory and stock management', true),
    ('00000000-0000-0000-0000-000000000000', 'Procurement', 'Purchasing and supplier management', true),
    ('00000000-0000-0000-0000-000000000000', 'Finance', 'Financial operations and accounting', true),
    ('00000000-0000-0000-0000-000000000000', 'Operations', 'General business operations', true);

-- Handle existing role column - first drop the old enum constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update the role column to use new values
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE VARCHAR(50);

-- Update existing role values to match new system BEFORE adding constraint
UPDATE public.profiles 
SET role = CASE 
    WHEN role = 'admin' THEN 'super_admin'
    WHEN role = 'manager' THEN 'department_manager'
    WHEN role = 'staff' THEN 'staff'
    ELSE 'super_admin'  -- Default fallback
END;

-- Update existing profiles to belong to default company
UPDATE public.profiles 
SET company_id = '00000000-0000-0000-0000-000000000000'
WHERE company_id IS NULL;

-- NOW add new role constraint after data is updated
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'company_owner', 'department_manager', 'staff'));

-- Add company_id to all existing tables
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.supplier_quotes 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.product_suppliers 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update existing records to belong to default company
UPDATE public.products SET company_id = '00000000-0000-0000-0000-000000000000' WHERE company_id IS NULL;
UPDATE public.suppliers SET company_id = '00000000-0000-0000-0000-000000000000' WHERE company_id IS NULL;
UPDATE public.stock_movements SET company_id = '00000000-0000-0000-0000-000000000000' WHERE company_id IS NULL;
UPDATE public.supplier_quotes SET company_id = '00000000-0000-0000-0000-000000000000' WHERE company_id IS NULL;
UPDATE public.product_suppliers SET company_id = '00000000-0000-0000-0000-000000000000' WHERE company_id IS NULL;
UPDATE public.purchase_orders SET company_id = '00000000-0000-0000-0000-000000000000' WHERE company_id IS NULL;
UPDATE public.purchase_order_items SET company_id = '00000000-0000-0000-0000-000000000000' WHERE company_id IS NULL;

-- Make company_id NOT NULL after populating
ALTER TABLE public.products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.stock_movements ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.supplier_quotes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.product_suppliers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.purchase_order_items ALTER COLUMN company_id SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON public.suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_company_id ON public.stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_company_id ON public.supplier_quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_company_id ON public.product_suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_id ON public.purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_company_id ON public.purchase_order_items(company_id);

-- Create function to get user's company context
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT role = 'super_admin'
        FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$;

-- Create function to check if user is company owner
CREATE OR REPLACE FUNCTION is_company_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT role = 'company_owner'
        FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$;

-- Create function to check if user is department manager
CREATE OR REPLACE FUNCTION is_department_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT role = 'department_manager'
        FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$;

-- Create function to check if user can modify data
CREATE OR REPLACE FUNCTION can_modify_data()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT role IN ('super_admin', 'company_owner', 'department_manager')
        FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$;
