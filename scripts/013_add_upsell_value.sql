-- Add upsell_value column to company_settings table
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS upsell_value INTEGER DEFAULT 1653;

COMMENT ON COLUMN company_settings.upsell_value IS 'Upsell value in cents for express delivery (default R$ 16,53)';
