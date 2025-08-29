-- Refine profiles RLS to include WITH CHECK for INSERT/UPDATE

-- Super admins can manage all profiles with explicit WITH CHECK
CREATE POLICY "Super admins can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Company owners can manage their company profiles explicitly
CREATE POLICY "Company owners can insert company profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_company_owner() AND company_id = get_user_company_id());

CREATE POLICY "Company owners can update company profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (is_company_owner() AND company_id = get_user_company_id())
  WITH CHECK (is_company_owner() AND company_id = get_user_company_id());


