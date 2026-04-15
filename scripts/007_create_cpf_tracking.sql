-- Create table to track CPF queries and PIX copies
CREATE TABLE IF NOT EXISTS cpf_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf VARCHAR(14) NOT NULL,
  nome VARCHAR(255),
  consulted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pix_copied BOOLEAN DEFAULT FALSE,
  pix_copied_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_cpf_tracking_cpf ON cpf_tracking(cpf);
CREATE INDEX IF NOT EXISTS idx_cpf_tracking_consulted_at ON cpf_tracking(consulted_at DESC);
CREATE INDEX IF NOT EXISTS idx_cpf_tracking_pix_copied ON cpf_tracking(pix_copied);
