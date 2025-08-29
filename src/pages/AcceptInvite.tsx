import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function AcceptInvite() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<any | null>(null);

  const params = new URLSearchParams(location.search);
  const token = params.get('token') || '';

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        console.log('Fetching invite with token:', token);
        
        const { data, error } = await supabase
          .from('invites')
          .select('*')
          .eq('token', token)
          .single();

        console.log('Invite fetch result:', { data, error });

        if (error) {
          console.error('Error fetching invite:', error);
          throw error;
        }
        
        if (!data) {
          console.error('No invite data found');
          throw new Error('Invite not found');
        }
        
        if (data.status !== 'pending') {
          console.error('Invite status is not pending:', data.status);
          throw new Error('Invite already used or invalid');
        }

        console.log('Invite fetched successfully:', data);
        setInvite(data);
      } catch (err: any) {
        console.error('Error in fetchInvite:', err);
        toast({ 
          title: 'Invalid invite', 
          description: err.message || 'Failed to load invite', 
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      console.log('Token found, fetching invite...');
      fetchInvite();
    } else {
      console.log('No token found');
      setLoading(false);
    }
  }, [token, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const full_name = (form.get('full_name') as string) || '';
    const phone = (form.get('phone') as string) || '';
    const password = (form.get('password') as string) || '';

    try {
      console.log('Starting invite acceptance process...');
      
      // 1) Sign up auth user
      console.log('Creating auth user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (signUpError) {
        console.error('Auth signup error:', signUpError);
        throw signUpError;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        console.error('No user ID returned from signup');
        throw new Error('User creation failed');
      }

      console.log('Auth user created, ID:', userId);

      // 2) Create profile
      console.log('Creating profile...');
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email: invite.email,
        full_name,
        phone,
        role: invite.role,
        company_id: invite.company_id,
        department_id: invite.department_id,
        employee_number: invite.employee_number,
        is_active: true,
        account_status: 'active'
      });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Profile created successfully');

      // 3) Mark invite accepted
      console.log('Updating invite status...');
      const { error: inviteError } = await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);
        
      if (inviteError) {
        console.error('Invite update error:', inviteError);
        throw inviteError;
      }

      console.log('Invite accepted successfully');
      toast({ title: 'Account created', description: 'You can now sign in.' });
      navigate('/auth', { replace: true });
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      toast({ 
        title: 'Failed to accept invite', 
        description: err.message || 'An unexpected error occurred', 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid or expired invite</CardTitle>
            <CardDescription>Request a new invite from your administrator.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invite</CardTitle>
          <CardDescription>
            Invited as {invite.role.replace('_',' ')}{invite.company_id ? ' to a company' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


