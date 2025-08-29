-- Adjust invites RLS to allow reading pending, non-expired invites to enable acceptance without login

-- Remove previous read-by-token policy if exists
DROP POLICY IF EXISTS invites_read_by_token ON public.invites;

-- Allow SELECT of pending, non-expired invites to anon/authenticated
CREATE POLICY invites_read_pending ON public.invites
  FOR SELECT TO anon, authenticated
  USING (status = 'pending' AND now() <= expires_at);


