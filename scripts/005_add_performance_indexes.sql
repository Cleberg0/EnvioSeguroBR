-- Add indexes for better query performance with 10k+ records

-- Index on CPF for fast lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_packages_cpf ON packages(cpf);

-- Index on codigo_rastreio for tracking code lookups
CREATE INDEX IF NOT EXISTS idx_packages_codigo_rastreio ON packages(codigo_rastreio);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages(created_at DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_packages_cpf_status ON packages(cpf, status);
