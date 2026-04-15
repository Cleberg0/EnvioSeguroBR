-- Create gateway_settings table for dynamic payment gateway configuration
CREATE TABLE IF NOT EXISTS gateway_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name TEXT NOT NULL DEFAULT 'Hygros',
  api_url TEXT NOT NULL DEFAULT 'https://api.gw.hygrospay.com.br/functions/v1/transactions',
  secret_key TEXT NOT NULL,
  company_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default Hygros gateway
INSERT INTO gateway_settings (gateway_name, api_url, secret_key, company_id)
VALUES (
  'Hygros',
  'https://api.gw.hygrospay.com.br/functions/v1/transactions',
  '',
  ''
) ON CONFLICT DO NOTHING;
