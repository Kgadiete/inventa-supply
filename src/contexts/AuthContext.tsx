import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Profile, Company, Department } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  department: Department | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
  isCompanyOwner: boolean;
  isDepartmentManager: boolean;
  canModify: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state...');
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('AuthProvider: Timeout reached, setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session?.user?.email);
        clearTimeout(timeoutId);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('AuthProvider: Initial session check:', session?.user?.email, error);
      clearTimeout(timeoutId);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('AuthProvider: Error getting session:', error);
      clearTimeout(timeoutId);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          company:companies(*),
          department:departments(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      console.log('AuthContext: Profile fetched:', data);
      console.log('AuthContext: Company data:', data.company);
      console.log('AuthContext: Department data:', data.department);
      
      setProfile(data);
      setCompany(data.company);
      setDepartment(data.department);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      }

      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };



  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isSuperAdmin = profile?.role === 'super_admin';
  const isCompanyOwner = profile?.role === 'company_owner';
  const isDepartmentManager = profile?.role === 'department_manager';
  const canModify = isSuperAdmin || isCompanyOwner || isDepartmentManager;
  
  // Debug logging
  console.log('AuthContext: Role checks:', {
    profile: profile?.role,
    isSuperAdmin,
    isCompanyOwner,
    isDepartmentManager,
    canModify
  });
  
  // Additional safety checks
  if (profile && !profile.role) {
    console.error('AuthContext: Profile has no role defined:', profile);
  }
  
  if (profile && !['super_admin', 'company_owner', 'department_manager', 'staff'].includes(profile.role)) {
    console.error('AuthContext: Profile has invalid role:', profile.role);
  }
  


  const value = {
    user,
    session,
    profile,
    company,
    department,
    loading,
    signIn,
    signOut,
    isSuperAdmin,
    isCompanyOwner,
    isDepartmentManager,
    canModify,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};