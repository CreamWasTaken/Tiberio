-- Migration: Add supplier_id column to products table
-- This allows each product to have its own supplier, independent of the price_list supplier

-- Add supplier_id column to products table
ALTER TABLE products ADD COLUMN supplier_id INT NULL;

-- Add foreign key constraint to suppliers table
ALTER TABLE products ADD CONSTRAINT fk_products_supplier 
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_products_supplier_id ON products(supplier_id);

-- Optional: Migrate existing data from price_list to products
-- This will copy the supplier_id from price_list to products for existing records
UPDATE products p 
INNER JOIN price_list pl ON p.price_list_id = pl.id 
SET p.supplier_id = pl.supplier_id 
WHERE p.supplier_id IS NULL AND pl.supplier_id IS NOT NULL;
