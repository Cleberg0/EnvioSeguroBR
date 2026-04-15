-- Add webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  transaction_id TEXT,
  cpf TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment confirmation timestamp to cpf_tracking
ALTER TABLE cpf_tracking ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_transaction ON webhook_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_cpf_tracking_payment_status ON cpf_tracking(payment_status);
