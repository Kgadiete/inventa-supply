-- Add extra fields to profiles and create invites table for onboarding

-- 1) Extend profiles with phone, account_status, employee_number
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone varchar(30),
  ADD COLUMN IF NOT EXISTS account_status varchar(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS employee_number varchar(6);

-- Unique employee number per company (nullable allowed)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_profiles_employee_per_company
ON public.profiles (company_id, employee_number)
WHERE employee_number IS NOT NULL;

-- 2) Invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  role varchar(50) NOT NULL CHECK (role IN ('company_owner','department_manager','staff')),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  employee_number varchar(6),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);

-- 3) Employee number generator function
CREATE OR REPLACE FUNCTION public.generate_employee_number(p_company_id uuid)
RETURNS varchar(6) AS $$
DECLARE
  candidate varchar(6);
  tries int := 0;
BEGIN
  LOOP
    candidate := lpad((floor(random()*1000000))::int::text, 6, '0');
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE company_id = p_company_id AND employee_number = candidate
    ) THEN
      RETURN candidate;
    END IF;
    tries := tries + 1;
    IF tries > 20 THEN
      RAISE EXCEPTION 'Could not generate unique employee number';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 4) RLS policies for invites
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Super admins can do anything
CREATE POLICY invites_super_admin_all ON public.invites
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Company owners can manage invites for their company
CREATE POLICY invites_company_owner_manage ON public.invites
  FOR ALL TO authenticated
  USING (
    public.is_company_owner() AND company_id = public.get_user_company_id()
  )
  WITH CHECK (
    public.is_company_owner() AND company_id = public.get_user_company_id()
  );

-- Public can read an invite by token only (for accept screen)
CREATE POLICY invites_read_by_token ON public.invites
  FOR SELECT TO anon, authenticated
  USING (token::text = current_setting('request.jwt.claims', true)::jsonb->>'invite_token');

-- Note: For the accept-invite flow, frontend should fetch by token with service header
-- alternatively, consider a dedicated edge function. For now, allow authenticated
-- users to select by token directly; owners/admins will create invites.


