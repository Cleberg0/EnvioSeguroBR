-- Add envio field to packages table
-- This field stores the carrier/transportadora name (e.g., "Loggi", "J&T Express")
-- Previously this value was incorrectly stored in the 'produto' field

ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS envio TEXT;
