-- Add new columns to track full conversion funnel
ALTER TABLE cpf_tracking 
ADD COLUMN IF NOT EXISTS clicked_regularizar BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS clicked_regularizar_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create index for payment tracking
CREATE INDEX IF NOT EXISTS idx_cpf_tracking_payment_status ON cpf_tracking(payment_status);
CREATE INDEX IF NOT EXISTS idx_cpf_tracking_clicked_regularizar ON cpf_tracking(clicked_regularizar);
