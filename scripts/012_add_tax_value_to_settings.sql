-- Updated default tax value to R$ 53,49 (5349 centavos)
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS tax_value INTEGER DEFAULT 5349;

-- Set default tax value for existing row
UPDATE company_settings SET tax_value = 5349 WHERE tax_value IS NULL OR tax_value = 3543;
