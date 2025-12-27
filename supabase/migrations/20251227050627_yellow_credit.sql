/*
  # LedgerOne Business Management Schema

  1. New Tables
    - `businesses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `owner_id` (uuid, references auth.users)
      - `settings` (jsonb for business configuration)
      - `created_at` (timestamp)

    - `employees`
      - `id` (uuid, primary key)
      - `business_id` (uuid, references businesses)
      - `name` (text)
      - `passcode` (text, encrypted)
      - `permissions` (jsonb for access control)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `products`
      - `id` (uuid, primary key)
      - `business_id` (uuid, references businesses)
      - `name` (text)
      - `price` (decimal)
      - `cost` (decimal, optional)
      - `stock_quantity` (integer)
      - `low_stock_threshold` (integer)
      - `created_at` (timestamp)

    - `transactions`
      - `id` (uuid, primary key)
      - `business_id` (uuid, references businesses)
      - `employee_id` (uuid, references employees, nullable for owner)
      - `total_amount` (decimal)
      - `transaction_type` (text: 'sale', 'return')
      - `created_at` (timestamp)

    - `transaction_items`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions)
      - `product_id` (uuid, references products, nullable for custom items)
      - `item_name` (text)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `total_price` (decimal)

  2. Security
    - Enable RLS on all tables
    - Add policies for business data isolation
    - Owner and employee access control
*/

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users NOT NULL,
  settings jsonb DEFAULT '{"pos_type": "simple", "auto_logout": false}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses NOT NULL,
  name text NOT NULL,
  passcode text NOT NULL,
  permissions jsonb DEFAULT '{"pos_access": false, "inventory_access": false, "dashboard_access": false}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses NOT NULL,
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  cost decimal(10,2) DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses NOT NULL,
  employee_id uuid REFERENCES employees,
  total_amount decimal(10,2) NOT NULL,
  transaction_type text DEFAULT 'sale',
  payment_method text DEFAULT 'cash',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create transaction_items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions NOT NULL,
  product_id uuid REFERENCES products,
  item_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL
);

ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Business policies
CREATE POLICY "Owners can manage their business"
  ON businesses
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

-- Employee policies
CREATE POLICY "Business owners can manage employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = employees.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Product policies
CREATE POLICY "Business members can access products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = products.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = products.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Transaction policies
CREATE POLICY "Business members can view transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = transactions.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business members can create transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = transactions.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Transaction items policies
CREATE POLICY "Business members can access transaction items"
  ON transaction_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN businesses b ON t.business_id = b.id
      WHERE t.id = transaction_items.transaction_id 
      AND b.owner_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_employees_business_id ON employees(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);

-- Create updated_at trigger for products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();