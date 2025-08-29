import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Company, Profile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, TrendingUp, Plus, Eye, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminDashboard() {
  const { profile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchDashboardData();
    }
  }, [isSuperAdmin]);

  const fetchDashboardData = async () => {
    try {
      console.log('SuperAdminDashboard: Fetching dashboard data...');
      
      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        throw testError;
      }
      
      console.log('Database connection successful');
      
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
        throw companiesError;
      }
      
      console.log('Companies fetched:', companiesData);
      setCompanies(companiesData || []);

      // Fetch total users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error fetching users count:', usersError);
        throw usersError;
      }
      
      console.log('Users count fetched:', usersCount);
      setTotalUsers(usersCount || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStats = () => {
    const stats = {
      free: 0,
      premium: 0,
      enterprise: 0
    };

    companies.forEach(company => {
      stats[company.subscription_plan]++;
    });

    return stats;
  };

  const getCompanySizeStats = () => {
    const stats = {
      small: 0,
      medium: 0,
      large: 0
    };

    companies.forEach(company => {
      if (company.size) {
        const size = company.size.toLowerCase();
        if (stats[size as keyof typeof stats] !== undefined) {
          stats[size as keyof typeof stats]++;
        }
      }
    });

    return stats;
  };

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Access denied. Only Super Admins can view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const subscriptionStats = getSubscriptionStats();
  const companySizeStats = getCompanySizeStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and company management</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/company-management')}>
            <Building2 className="w-4 h-4 mr-2" />
            Manage Companies
          </Button>
          <Button variant="outline" onClick={() => navigate('/users')}>
            <Users className="w-4 h-4 mr-2" />
            Manage Users
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              Active companies in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users across all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Plans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.premium + subscriptionStats.enterprise}</div>
            <p className="text-xs text-muted-foreground">
              Premium + Enterprise subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Distribution of subscription tiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Free</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full" 
                    style={{ width: `${(subscriptionStats.free / companies.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">{subscriptionStats.free}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Premium</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(subscriptionStats.premium / companies.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">{subscriptionStats.premium}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enterprise</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${(subscriptionStats.enterprise / companies.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">{subscriptionStats.enterprise}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Sizes</CardTitle>
            <CardDescription>Distribution of company sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Small</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(companySizeStats.small / companies.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">{companySizeStats.small}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Medium</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${(companySizeStats.medium / companies.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">{companySizeStats.medium}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Large</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${(companySizeStats.large / companies.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">{companySizeStats.large}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Companies */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Companies</CardTitle>
          <CardDescription>Latest companies added to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.slice(0, 5).map((company) => (
              <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {company.industry || 'No industry'} • {company.size || 'No size'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={company.subscription_plan === 'free' ? 'secondary' : 'default'}>
                    {company.subscription_plan}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/company-management?company=${company.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {companies.length > 5 && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => navigate('/company-management')}>
                View All Companies
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/company-management')}
            >
              <Plus className="w-6 h-6" />
              <span>Add New Company</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/users')}
            >
              <Users className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
            {/* System Settings placeholder removed to avoid confusion */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
