-- ============================================================
-- MIGRATION: 003_add_interactive_product_type.sql
-- Menambahkan tipe 'interactive' ke product_type pada digital_products
-- ============================================================

-- Drop constraint lama dan buat ulang dengan tipe baru
ALTER TABLE public.digital_products DROP CONSTRAINT IF EXISTS digital_products_product_type_check;
ALTER TABLE public.digital_products ADD CONSTRAINT digital_products_product_type_check 
  CHECK (product_type IN ('pdf', 'template', 'interactive', 'other'));
