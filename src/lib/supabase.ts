import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface Business {
  id: string;
  name: string;
  owner_id: string;
  settings: {
    pos_type: 'simple' | 'calculator';
    auto_logout: boolean;
  };
  created_at: string;
}

export interface Employee {
  id: string;
  business_id: string;
  name: string;
  passcode: string;
  permissions: {
    pos_access: boolean;
    inventory_access: boolean;
    dashboard_access: boolean;
  };
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  price: number;
  cost: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  employee_id?: string;
  total_amount: number;
  transaction_type: string;
  payment_method: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}