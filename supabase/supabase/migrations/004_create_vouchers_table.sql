-- Membuat tipe ENUM untuk jenis diskon
DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Membuat tabel vouchers
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type discount_type NOT NULL,
    discount_value INTEGER NOT NULL, -- nilai persen (contoh: 20) atau nominal (contoh: 50000)
    max_discount INTEGER, -- opsional: batas maksimal nominal diskon jika tipenya percentage
    max_uses INTEGER, -- opsional: kuota maksimal penggunaan (misal: 100 orang)
    current_uses INTEGER DEFAULT 0 NOT NULL,
    valid_from TIMESTAMPTZ, -- opsional: mulai berlaku
    valid_until TIMESTAMPTZ, -- opsional: kedaluwarsa
    applicable_package_ids UUID[], -- opsional: list ID paket yang boleh pakai voucher ini. Jika NULL, berarti semua paket.
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Menambahkan kolom voucher_id dan discount_amount di tabel transactions untuk pelacakan
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;

-- Kebijakan RLS (Row Level Security) untuk Vouchers
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Siapapun (termasuk anon/user biasa) bisa MELIHAT voucher aktif (untuk keperluan validasi kode promo)
CREATE POLICY "Everyone can view active vouchers" 
ON vouchers FOR SELECT 
USING (is_active = true);

-- Hanya Super Admin yang bisa mengelola (CRUD) vouchers secara bebas
CREATE POLICY "Super admin can manage vouchers" 
ON vouchers FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
  )
);

-- Buat fungsi update_updated_at_column jika belum ada
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger update_updated_at_column (hapus dulu jika sudah ada agar tidak duplikat)
DROP TRIGGER IF EXISTS update_vouchers_updated_at ON vouchers;
CREATE TRIGGER update_vouchers_updated_at
BEFORE UPDATE ON vouchers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
