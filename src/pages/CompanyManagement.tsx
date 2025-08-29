import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Company, Department, Profile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Plus, Edit, Trash2, Eye, UserPlus, Mail, Phone, Globe, MapPin, Link as LinkIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [inviteLink, setInviteLink] = useState<string>('');

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
    max_users: 50,
    owner_email: '',
    owner_name: '',
    additional_users: [] as Array<{
      email: string;
      name: string;
      role: 'company_owner' | 'department_manager' | 'staff';
      department_id?: string;
    }>
  });

  // Department form state
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    manager_email: '',
    manager_name: ''
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
      fetchAvailableUsers();
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
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .is('company_id', null);

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const fetchCompanyDetails = async (companyId: string) => {
    try {
      // Fetch company users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId);

      if (usersError) throw usersError;
      setCompanyUsers(usersData || []);

      // Fetch company departments
      const { data: deptsData, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId);

      if (deptsError) throw deptsError;
      setCompanyDepartments(deptsData || []);
    } catch (error) {
      console.error('Error fetching company details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch company details",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCompany) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            industry: formData.industry,
            size: formData.size,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            subscription_plan: formData.subscription_plan,
            max_users: formData.max_users,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCompany.id);

        if (error) throw error;

        // Persist owner change if provided
        if (formData.owner_email) {
          let { data: existingUser } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', formData.owner_email)
            .single();

          if (!existingUser) {
            const { error: ownerCreateError } = await supabase
              .from('profiles')
              .insert({
                email: formData.owner_email,
                full_name: formData.owner_name || formData.owner_email.split('@')[0],
                role: 'company_owner',
                company_id: editingCompany.id,
                is_active: true
              });
            if (ownerCreateError) throw ownerCreateError;
          } else {
            const { error: ownerUpdateError } = await supabase
              .from('profiles')
              .update({
                role: 'company_owner',
                company_id: editingCompany.id,
                is_active: true
              })
              .eq('id', existingUser.id);
            if (ownerUpdateError) throw ownerUpdateError;
          }
        }

        toast({
          title: "Success",
          description: "Company updated successfully"
        });
      } else {
        // Create new company
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            industry: formData.industry,
            size: formData.size,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            subscription_plan: formData.subscription_plan,
            max_users: formData.max_users
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // Create default departments
        const defaultDepartments = [
          { name: 'Warehouse', description: 'Inventory and stock management' },
          { name: 'Procurement', description: 'Purchasing and supplier management' },
          { name: 'Finance', description: 'Financial operations and accounting' },
          { name: 'Operations', description: 'General business operations' }
        ];

        for (const dept of defaultDepartments) {
          await supabase
            .from('departments')
            .insert({
              name: dept.name,
              description: dept.description,
              company_id: companyData.id
            });
        }

        // Assign owner if email provided
        if (formData.owner_email) {
          // Check if user exists
          let { data: existingUser } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', formData.owner_email)
            .single();

          if (!existingUser) {
            // Create invite instead of directly creating profile
            const { data: invite, error: inviteError } = await supabase
              .from('invites')
              .insert({
                email: formData.owner_email,
                role: 'company_owner',
                company_id: companyData.id,
                invited_by: user?.id
              })
              .select()
              .single();
            if (inviteError) throw inviteError;
            setInviteLink(`${window.location.origin}/accept-invite?token=${invite.token}`);
          } else {
            // Update existing user
            await supabase
              .from('profiles')
              .update({
                role: 'company_owner',
                company_id: companyData.id,
                is_active: true
              })
              .eq('id', existingUser.id);
          }
        }

        // Add additional users if provided
        for (const userData of formData.additional_users) {
          if (userData.email) {
            let { data: existingUser } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', userData.email)
              .single();

            if (!existingUser) {
              // Create new user
              await supabase
                .from('profiles')
                .insert({
                  email: userData.email,
                  full_name: userData.name || userData.email.split('@')[0],
                  role: userData.role,
                  company_id: companyData.id,
                  department_id: userData.department_id,
                  is_active: true
                });
            } else {
              // Update existing user
              await supabase
                .from('profiles')
                .update({
                  role: userData.role,
                  company_id: companyData.id,
                  department_id: userData.department_id,
                  is_active: true
                })
                .eq('id', existingUser.id);
            }
          }
        }

        toast({
          title: "Success",
          description: inviteLink ? "Company created. Copy and send the invite link to the owner." : "Company created successfully with users assigned"
        });
      }

      resetForm();
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: "Error",
        description: "Failed to save company",
        variant: "destructive"
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
      max_users: 50,
      owner_email: '',
      owner_name: '',
      additional_users: []
    });
    setEditingCompany(null);
    setShowCreateForm(false);
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
      max_users: company.max_users,
      owner_email: '',
      owner_name: '',
      additional_users: []
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
        title: "Success",
        description: "Company deleted successfully"
      });
      fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive"
      });
    }
  };

  const addAdditionalUser = () => {
    setFormData(prev => ({
      ...prev,
      additional_users: [...prev.additional_users, {
        email: '',
        name: '',
        role: 'staff',
        department_id: undefined
      }]
    }));
  };

  const removeAdditionalUser = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additional_users: prev.additional_users.filter((_, i) => i !== index)
    }));
  };

  const updateAdditionalUser = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      additional_users: prev.additional_users.map((user, i) => 
        i === index ? { ...user, [field]: value } : user
      )
    }));
  };

  const createDepartment = async () => {
    if (!selectedCompany || !departmentForm.name) return;

    try {
      const { error } = await supabase
        .from('departments')
        .insert({
          name: departmentForm.name,
          description: departmentForm.description,
          company_id: selectedCompany.id
        });

      if (error) throw error;

      // Assign manager if provided
      if (departmentForm.manager_email) {
        let { data: existingUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', departmentForm.manager_email)
          .single();

        if (!existingUser) {
          // Create new user
          await supabase
            .from('profiles')
            .insert({
              email: departmentForm.manager_email,
              full_name: departmentForm.manager_name || departmentForm.manager_email.split('@')[0],
              role: 'department_manager',
              company_id: selectedCompany.id,
              is_active: true
            });
        } else {
          // Update existing user
          await supabase
            .from('profiles')
            .update({
              role: 'department_manager',
              company_id: selectedCompany.id,
              is_active: true
            })
            .eq('id', existingUser.id);
        }
      }

      toast({
        title: "Success",
        description: "Department created successfully"
      });

      setDepartmentForm({
        name: '',
        description: '',
        manager_email: '',
        manager_name: ''
      });

      fetchCompanyDetails(selectedCompany.id);
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: "Error",
        description: "Failed to create department",
        variant: "destructive"
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Company Management</h1>
          <p className="text-muted-foreground">Manage companies and their users</p>
        </div>
        <Button onClick={() => {
          // Open fresh create form (not edit)
          setEditingCompany(null);
          setInviteLink('');
          setFormData({
            name: '',
            industry: '',
            size: '',
            address: '',
            phone: '',
            email: '',
            website: '',
            subscription_plan: 'free',
            max_users: 50,
            owner_email: '',
            owner_name: '',
            additional_users: []
          });
          setShowCreateForm(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Company Creation/Edit Form */}
      <Dialog 
        open={showCreateForm} 
        onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) {
            setEditingCompany(null);
            setInviteLink('');
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? 'Edit Company' : 'Create New Company'}
            </DialogTitle>
            <DialogDescription>
              {editingCompany ? 'Update company information' : 'Create a new company and assign users'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Company Size</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1-50 employees)</SelectItem>
                    <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                    <SelectItem value="large">Large (200+ employees)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_plan">Subscription Plan</Label>
                <Select
                  value={formData.subscription_plan}
                  onValueChange={(value: 'free' | 'premium' | 'enterprise') => 
                    setFormData(prev => ({ ...prev, subscription_plan: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_users: parseInt(e.target.value) }))}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Company Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Company Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Owner Assignment */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Company Owner</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_email">Owner Email *</Label>
                  <Input
                    id="owner_email"
                    type="email"
                    value={formData.owner_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, owner_email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner_name">Owner Name</Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Additional Users */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Additional Users (Optional)</h3>
                <Button type="button" variant="outline" onClick={addAdditionalUser}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
              
              {formData.additional_users.map((user, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">User {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAdditionalUser(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={user.email}
                        onChange={(e) => updateAdditionalUser(index, 'email', e.target.value)}
                        placeholder="user@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={user.name}
                        onChange={(e) => updateAdditionalUser(index, 'name', e.target.value)}
                        placeholder="Full Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={user.role}
                        onValueChange={(value: 'company_owner' | 'department_manager' | 'staff') => 
                          updateAdditionalUser(index, 'role', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company_owner">Company Owner</SelectItem>
                          <SelectItem value="department_manager">Department Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-6 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCompany ? 'Update Company' : 'Create Company'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {company.name}
                  </CardTitle>
                  <CardDescription>
                    {company.industry || 'No industry'} • {company.size || 'No size'}
                  </CardDescription>
                </div>
                <Badge variant={company.subscription_plan === 'free' ? 'secondary' : 'default'}>
                  {company.subscription_plan}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {company.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {company.email}
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {company.phone}
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    {company.website}
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {company.address}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(company)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(company)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(company.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inviteLink && (
        <Card>
          <CardHeader>
            <CardTitle>Owner Invite Link</CardTitle>
            <CardDescription>Copy and send this link to the owner to complete setup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input readOnly value={inviteLink} />
              <Button type="button" onClick={() => navigator.clipboard.writeText(inviteLink)}>
                <LinkIcon className="w-4 h-4 mr-2" /> Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Details Modal */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCompany?.name} - Company Details</DialogTitle>
            <DialogDescription>
              Manage users and departments for this company
            </DialogDescription>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-6">
              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Industry:</span> {selectedCompany.industry || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {selectedCompany.size || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Plan:</span> {selectedCompany.subscription_plan}
                    </div>
                    <div>
                      <span className="font-medium">Max Users:</span> {selectedCompany.max_users}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Users ({companyUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {companyUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Departments */}
              <Card>
                <CardHeader>
                  <CardTitle>Departments ({companyDepartments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {companyDepartments.map((dept) => (
                      <div key={dept.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium">{dept.name}</h4>
                        <p className="text-sm text-muted-foreground">{dept.description}</p>
                      </div>
                    ))}
                    
                    {/* Create New Department */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-medium">Create New Department</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Department Name</Label>
                          <Input
                            value={departmentForm.name}
                            onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Marketing"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={departmentForm.description}
                            onChange={(e) => setDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Department purpose"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Manager Email (Optional)</Label>
                          <Input
                            type="email"
                            value={departmentForm.manager_email}
                            onChange={(e) => setDepartmentForm(prev => ({ ...prev, manager_email: e.target.value }))}
                            placeholder="manager@company.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Manager Name</Label>
                          <Input
                            value={departmentForm.manager_name}
                            onChange={(e) => setDepartmentForm(prev => ({ ...prev, manager_name: e.target.value }))}
                            placeholder="Manager Name"
                          />
                        </div>
                      </div>
                      <Button onClick={createDepartment} disabled={!departmentForm.name}>
                        Create Department
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
