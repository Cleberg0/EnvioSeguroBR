-- Add total_paid column to lists table
ALTER TABLE lists ADD COLUMN IF NOT EXISTS total_paid INTEGER DEFAULT 0;

-- Add total_amount_paid column to track total revenue
ALTER TABLE lists ADD COLUMN IF NOT EXISTS total_amount_paid NUMERIC DEFAULT 0;

-- Update existing lists to count paid entries from cpf_tracking
UPDATE lists SET total_paid = (
  SELECT COUNT(*) FROM cpf_tracking 
  WHERE cpf_tracking.lista_id = lists.id 
  AND cpf_tracking.payment_status = 'paid'
);
