import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Company, Department, Profile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Plus, Edit, Trash2, Eye } from 'lucide-react';

export default function CompanyManagement() {
  const { user, profile, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<Profile[]>([]);
  const [companyDepartments, setCompanyDepartments] = useState<Department[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    subscription_plan: 'free' as const,
    max_users: 50
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
    }
  }, [isSuperAdmin]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (companyId: string) => {
    try {
      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId);

      if (usersError) throw usersError;
      setCompanyUsers(users || []);

      // Fetch departments
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId);

      if (deptError) throw deptError;
      setCompanyDepartments(departments || []);
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCompany) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update(formData)
          .eq('id', editingCompany.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Company updated successfully',
        });
      } else {
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Company created successfully',
        });
      }

      setShowCreateForm(false);
      setEditingCompany(null);
      resetForm();
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      industry: '',
      size: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      subscription_plan: 'free',
      max_users: 50
    });
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry || '',
      size: company.size || '',
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      subscription_plan: company.subscription_plan,
      max_users: company.max_users
    });
    setShowCreateForm(true);
  };

  const handleView = (company: Company) => {
    setSelectedCompany(company);
    fetchCompanyDetails(company.id);
  };

  const handleDelete = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Company deleted successfully',
      });

      fetchCompanies();
      if (selectedCompany?.id === companyId) {
        setSelectedCompany(null);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete company',
        variant: 'destructive',
      });
    }
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Company Management</h1>
          <p className="text-muted-foreground">Manage all companies in the system</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCompany ? 'Edit Company' : 'Create New Company'}</CardTitle>
            <CardDescription>
              {editingCompany ? 'Update company information' : 'Add a new company to the system'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Company Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., Small, Medium, Large"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription_plan">Subscription Plan</Label>
                  <select
                    id="subscription_plan"
                    value={formData.subscription_plan}
                    onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value as any })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_users">Max Users</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCompany(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Companies ({companies.length})</CardTitle>
              <CardDescription>All companies in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedCompany?.id === company.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleView(company)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold">{company.name}</h3>
                          <Badge variant={company.subscription_plan === 'free' ? 'secondary' : 'default'}>
                            {company.subscription_plan}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {company.industry && <p>Industry: {company.industry}</p>}
                          {company.size && <p>Size: {company.size}</p>}
                          {company.email && <p>Email: {company.email}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(company);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(company.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Details */}
        {selectedCompany && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{selectedCompany.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Industry: {selectedCompany.industry || 'N/A'}</p>
                    <p>Size: {selectedCompany.size || 'N/A'}</p>
                    <p>Plan: {selectedCompany.subscription_plan}</p>
                    <p>Max Users: {selectedCompany.max_users}</p>
                    <p>Created: {new Date(selectedCompany.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Users ({companyUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {companyUsers.map((user) => (
                    <div key={user.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Departments ({companyDepartments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {companyDepartments.map((dept) => (
                    <div key={dept.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        {dept.description && (
                          <p className="text-sm text-muted-foreground">{dept.description}</p>
                        )}
                      </div>
                      {dept.is_predefined && (
                        <Badge variant="secondary">Predefined</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
