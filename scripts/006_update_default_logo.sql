-- Update company settings with new J&T Express logo
UPDATE company_settings 
SET 
  company_name = 'J&T Express',
  logo_url = '/images/jet.jpg',
  updated_at = NOW()
WHERE id IS NOT NULL;

-- Insert default if no settings exist
INSERT INTO company_settings (company_name, logo_url, banner_url)
SELECT 'J&T Express', '/images/jet.jpg', ''
WHERE NOT EXISTS (SELECT 1 FROM company_settings);
