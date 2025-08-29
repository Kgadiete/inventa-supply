-- Fix company_id mismatch in profiles table
-- This migration updates profiles that have the default UUID (00000000-0000-0000-0000-000000000000)
-- to have the correct company_id based on the company name

-- First, let's see what we're working with
-- SELECT id, email, role, company_id, 
--        (SELECT name FROM companies WHERE id = company_id) as company_name
-- FROM profiles 
-- WHERE company_id = '00000000-0000-0000-0000-000000000000';

-- Update profiles to have the correct company_id
-- For now, we'll update based on the company name from the debug info
UPDATE profiles 
SET company_id = (
  SELECT id FROM companies WHERE name = 'Abalu Inc.'
)
WHERE company_id = '00000000-0000-0000-0000-000000000000'
AND role = 'company_owner';

-- Also update any other profiles that might have the wrong company_id
UPDATE profiles 
SET company_id = (
  SELECT id FROM companies WHERE name = 'Abalu Inc.'
)
WHERE company_id = '00000000-0000-0000-0000-000000000000'
AND email = 'other.tings1030@gmail.com';

-- Verify the fix
-- SELECT id, email, role, company_id, 
--        (SELECT name FROM companies WHERE id = company_id) as company_name
-- FROM profiles 
-- WHERE email = 'other.tings1030@gmail.com';
