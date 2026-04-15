-- Fix invalid tracking codes in packages table
-- This will update any tracking code that doesn't match the pattern XX123456789BR

-- First, let's create a function to generate valid tracking codes
CREATE OR REPLACE FUNCTION generate_tracking_code() RETURNS TEXT AS $$
DECLARE
  prefixes TEXT[] := ARRAY['NX', 'RX', 'LX', 'JD', 'NB', 'RB', 'LB', 'CX', 'CP', 'RR'];
  prefix TEXT;
  numbers TEXT;
BEGIN
  prefix := prefixes[1 + floor(random() * array_length(prefixes, 1))::int];
  numbers := lpad(floor(random() * 900000000 + 100000000)::text, 9, '0');
  RETURN prefix || numbers || 'BR';
END;
$$ LANGUAGE plpgsql;

-- Update packages with invalid tracking codes (shorter than 10 chars, contains negative numbers, or doesn't end with BR)
UPDATE packages
SET 
  codigo_rastreio = generate_tracking_code(),
  remessa = generate_tracking_code()
WHERE 
  codigo_rastreio IS NULL 
  OR length(codigo_rastreio) < 10
  OR codigo_rastreio ~ '^-'
  OR codigo_rastreio ~ '^\d+$'
  OR codigo_rastreio !~ '[A-Z]{2}\d{9}BR$';

-- Clean up the function
DROP FUNCTION IF EXISTS generate_tracking_code();

-- Show how many were updated
SELECT COUNT(*) as updated_count FROM packages WHERE codigo_rastreio ~ '[A-Z]{2}\d{9}BR$';
