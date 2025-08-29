-- Create a function to call the Edge Function when an invite is created
CREATE OR REPLACE FUNCTION public.send_invite_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function to send the invitation email
  PERFORM
    net.http_post(
      url := 'https://jvqemkipixrvfmqwfgdq.supabase.co/functions/v1/send-invite',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cWVta2lwaXhydmZtcXdmZ2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MjMxNCwiZXhwIjoyMDcxOTY4MzE0fQ.0ZEpHZZIfYiZO9NoOwUnztEFHvzMTLwUnaGbz13-aYs"}',
      body := json_build_object(
        'email', NEW.email,
        'role', NEW.role,
        'company_name', COALESCE((SELECT name FROM companies WHERE id = NEW.company_id), 'our platform'),
        'token', NEW.token,
        'invite_url', 'https://jvqemkipixrvfmqwfgdq.supabase.co/accept-invite?token=' || NEW.token
      )::text
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to call the function on INSERT
CREATE TRIGGER trigger_send_invite_email
  AFTER INSERT ON public.invites
  FOR EACH ROW
  EXECUTE FUNCTION public.send_invite_email();

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "http";
