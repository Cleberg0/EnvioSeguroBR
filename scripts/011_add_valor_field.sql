-- Add valor field to packages table
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2);

-- Add comment
COMMENT ON COLUMN public.packages.valor IS 'Product value in BRL';
