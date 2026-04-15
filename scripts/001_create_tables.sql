-- Create company settings table to store logo and company name
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Rastreamento de Encomendas',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.company_settings (company_name) 
VALUES ('Rastreamento de Encomendas')
ON CONFLICT DO NOTHING;

-- Create packages table to store all tracking information
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf TEXT NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  produto TEXT NOT NULL,
  codigo_rastreio TEXT NOT NULL UNIQUE,
  endereco_rua TEXT NOT NULL,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT NOT NULL,
  endereco_cidade TEXT NOT NULL,
  endereco_estado TEXT NOT NULL,
  endereco_cep TEXT NOT NULL,
  remessa TEXT,
  status TEXT NOT NULL DEFAULT 'Pedido Postado',
  ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
  pedido_postado BOOLEAN DEFAULT true,
  pedido_em_rota BOOLEAN DEFAULT false,
  pedido_taxado BOOLEAN DEFAULT false,
  pedido_entregue BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on CPF for faster searches
CREATE INDEX IF NOT EXISTS idx_packages_cpf ON public.packages(cpf);
CREATE INDEX IF NOT EXISTS idx_packages_codigo_rastreio ON public.packages(codigo_rastreio);

-- Enable Row Level Security
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Policies for company_settings (public read, no auth needed)
CREATE POLICY "Allow public read access to company settings"
  ON public.company_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policies for packages (public read by CPF, no auth needed for tracking)
CREATE POLICY "Allow public read access to packages"
  ON public.packages FOR SELECT
  TO anon, authenticated
  USING (true);

-- For admin operations, we'll use service role key
-- These policies allow all operations when using service role
CREATE POLICY "Allow service role full access to company_settings"
  ON public.company_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to packages"
  ON public.packages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
