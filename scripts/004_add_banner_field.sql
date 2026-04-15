-- Add banner_url field to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS banner_url TEXT;
