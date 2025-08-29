import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Index() {
  const { user, loading, isSuperAdmin, isCompanyOwner, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    // Not signed in → go to auth
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
    // Signed in → route by role
    if (profile) {
      if (isSuperAdmin) navigate('/super-admin-dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [user, profile, loading, isSuperAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
          <p className="text-muted-foreground">Checking authentication</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Welcome back!</h1>
        <p className="text-muted-foreground mb-6">
          You are signed in as {user.email}
        </p>
        <a 
          href="/dashboard" 
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}