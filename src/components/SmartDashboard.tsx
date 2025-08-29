import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import CompanyOwnerDashboard from '@/pages/CompanyOwnerDashboard';

export default function SmartDashboard() {
  const { profile, isSuperAdmin, isCompanyOwner, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      // Redirect based on user role
      if (isSuperAdmin) {
        navigate('/super-admin-dashboard', { replace: true });
      } else if (isCompanyOwner) {
        // Show Company Owner Dashboard directly
        return;
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [profile, isSuperAdmin, isCompanyOwner, loading, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If Company Owner, show their dashboard directly
  if (isCompanyOwner) {
    return <CompanyOwnerDashboard />;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
