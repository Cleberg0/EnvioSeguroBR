-- Update packages table to match the simpler CSV structure
ALTER TABLE public.packages 
  DROP COLUMN IF EXISTS endereco_rua,
  DROP COLUMN IF EXISTS endereco_numero,
  DROP COLUMN IF EXISTS endereco_complemento,
  DROP COLUMN IF EXISTS endereco_bairro,
  DROP COLUMN IF EXISTS endereco_cidade,
  DROP COLUMN IF EXISTS endereco_estado,
  DROP COLUMN IF EXISTS endereco_cep;

-- Add single endereco field
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS endereco TEXT NOT NULL DEFAULT '';

-- Add remessa field if not exists
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS remessa TEXT;
