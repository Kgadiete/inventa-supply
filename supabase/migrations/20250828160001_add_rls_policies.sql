-- RLS Policies for Multi-Tenancy
-- This ensures data isolation between companies

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Super admins can view all companies" ON public.companies
    FOR SELECT USING (is_super_admin());

CREATE POLICY "Company owners can view their own company" ON public.companies
    FOR SELECT USING (id = get_user_company_id());

CREATE POLICY "Super admins can insert companies" ON public.companies
    FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update companies" ON public.companies
    FOR UPDATE USING (is_super_admin());

CREATE POLICY "Company owners can update their own company" ON public.companies
    FOR UPDATE USING (id = get_user_company_id());

-- Departments policies
CREATE POLICY "Users can view departments in their company" ON public.departments
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Company owners can manage departments" ON public.departments
    FOR ALL USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Super admins can manage all departments" ON public.departments
    FOR ALL USING (is_super_admin());

-- Profiles policies
CREATE POLICY "Users can view profiles in their company" ON public.profiles
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Company owners can manage company profiles" ON public.profiles
    FOR ALL USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Super admins can manage all profiles" ON public.profiles
    FOR ALL USING (is_super_admin());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- Products policies
CREATE POLICY "Users can view products in their company" ON public.products
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can modify products if they have permission" ON public.products
    FOR ALL USING (company_id = get_user_company_id() AND can_modify_data());

-- Suppliers policies
CREATE POLICY "Users can view suppliers in their company" ON public.suppliers
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can modify suppliers if they have permission" ON public.suppliers
    FOR ALL USING (company_id = get_user_company_id() AND can_modify_data());

-- Stock movements policies
CREATE POLICY "Users can view stock movements in their company" ON public.stock_movements
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can modify stock movements if they have permission" ON public.stock_movements
    FOR ALL USING (company_id = get_user_company_id() AND can_modify_data());

-- Supplier quotes policies
CREATE POLICY "Users can view supplier quotes in their company" ON public.supplier_quotes
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can modify supplier quotes if they have permission" ON public.supplier_quotes
    FOR ALL USING (company_id = get_user_company_id() AND can_modify_data());

-- Product suppliers policies
CREATE POLICY "Users can view product suppliers in their company" ON public.product_suppliers
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can modify product suppliers if they have permission" ON public.product_suppliers
    FOR ALL USING (company_id = get_user_company_id() AND can_modify_data());

-- Purchase orders policies
CREATE POLICY "Users can view purchase orders in their company" ON public.purchase_orders
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can modify purchase orders if they have permission" ON public.purchase_orders
    FOR ALL USING (company_id = get_user_company_id() AND can_modify_data());

-- Purchase order items policies
CREATE POLICY "Users can view purchase order items in their company" ON public.purchase_order_items
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can modify purchase order items if they have permission" ON public.purchase_order_items
    FOR ALL USING (company_id = get_user_company_id() AND can_modify_data());
