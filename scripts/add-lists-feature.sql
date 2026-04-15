-- Create lists table to track different uploaded lists
CREATE TABLE IF NOT EXISTS lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_leads INTEGER DEFAULT 0,
  total_consulted INTEGER DEFAULT 0,
  total_pix_copied INTEGER DEFAULT 0
);

-- Add lista_id column to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS lista_id UUID REFERENCES lists(id);

-- Add lista_id column to cpf_tracking table  
ALTER TABLE cpf_tracking ADD COLUMN IF NOT EXISTS lista_id UUID REFERENCES lists(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_packages_lista_id ON packages(lista_id);
CREATE INDEX IF NOT EXISTS idx_cpf_tracking_lista_id ON cpf_tracking(lista_id);

-- Enable RLS on lists table
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Allow service role full access to lists" ON lists FOR ALL USING (true);

-- Allow public read access
CREATE POLICY "Allow public read access to lists" ON lists FOR SELECT USING (true);
