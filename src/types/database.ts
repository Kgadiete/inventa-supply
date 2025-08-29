// Multi-Tenant Database Types
export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  subscription_plan: 'free' | 'premium' | 'enterprise';
  max_users: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_predefined: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  company_id: string;
  department_id?: string;
  role: 'super_admin' | 'company_owner' | 'department_manager' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_of_measure: string;
  location?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
  } | null;
  product_types?: string[] | null;
  rating?: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  company_id: string;
  created_at: string;
}

export interface SupplierQuote {
  id: string;
  supplier_id: string;
  product_id: string;
  price: number;
  currency: string;
  valid_until: string;
  company_id: string;
  created_at: string;
}

export interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  lead_time_days: number;
  minimum_order_quantity: number;
  company_id: string;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  user_id: string;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  total_amount: number;
  notes?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  company_id: string;
  created_at: string;
}

// Extended interfaces with relationships
export interface ProductWithSupplier extends Product {
  supplier?: Supplier;
}

export interface PurchaseOrderWithDetails extends PurchaseOrder {
  supplier?: Supplier;
  user?: Profile;
  items?: PurchaseOrderItem[];
}

export interface ProfileWithCompany extends Profile {
  company?: Company;
  department?: Department;
}

// Dashboard stats
export interface DashboardStats {
  totalProducts: number;
  totalSuppliers: number;
  totalOrderValue: number;
  lowStockProducts: number;
  recentPurchaseOrders: PurchaseOrderWithDetails[];
}
