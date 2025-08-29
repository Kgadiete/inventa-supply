import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Company, Department, Profile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Plus, Edit, Trash2, Eye, UserPlus, TrendingUp, Package, Truck, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function CompanyOwnerDashboard() {
  const { profile, company, isCompanyOwner } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companyUsers, setCompanyUsers] = useState<Profile[]>([]);
  const [companyDepartments, setCompanyDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [companyStats, setCompanyStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    totalProducts: 0,
    totalSuppliers: 0,
    totalOrders: 0
  });

  // Form states
  const [userForm, setUserForm] = useState({
    email: '',
    full_name: '',
    role: 'staff' as 'department_manager' | 'staff',
    department_id: 'no_department'
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (isCompanyOwner && company) {
      fetchCompanyData();
    }
  }, [isCompanyOwner, company]);

  const fetchCompanyData = async () => {
    if (!company) return;

    try {
      // Fetch company users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(name)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setCompanyUsers(usersData || []);

      // Fetch company departments
      const { data: deptsData, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', company.id)
        .order('name');

      if (deptsError) throw deptsError;
      setCompanyDepartments(deptsData || []);

      // Fetch company statistics
      const [productsCount, suppliersCount, ordersCount] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
        supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('company_id', company.id)
      ]);

      setCompanyStats({
        totalUsers: usersData?.length || 0,
        totalDepartments: deptsData?.length || 0,
        totalProducts: productsCount.count || 0,
        totalSuppliers: suppliersCount.count || 0,
        totalOrders: ordersCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch company data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company) return;

    try {
      if (editingUser) {
        // Update existing user
                 const { error } = await supabase
           .from('profiles')
           .update({
             full_name: userForm.full_name,
             role: userForm.role,
             department_id: userForm.department_id === 'no_department' ? null : userForm.department_id,
             updated_at: new Date().toISOString()
           })
           .eq('id', editingUser.id)
           .eq('company_id', company.id); // Security: only update users in own company

        if (error) throw error;

        toast({
          title: "Success",
          description: "User updated successfully"
        });
      } else {
                 // Create new user
         const { error } = await supabase
           .from('profiles')
           .insert({
             email: userForm.email,
             full_name: userForm.full_name,
             role: userForm.role,
             company_id: company.id,
             department_id: userForm.department_id === 'no_department' ? null : userForm.department_id,
             is_active: true
           });

        if (error) throw error;

        toast({
          title: "Success",
          description: "User created successfully"
        });
      }

      resetUserForm();
      fetchCompanyData();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: "Failed to save user",
        variant: "destructive"
      });
    }
  };

  const handleDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company) return;

    try {
      if (editingDepartment) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update({
            name: departmentForm.name,
            description: departmentForm.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDepartment.id)
          .eq('company_id', company.id); // Security: only update departments in own company

        if (error) throw error;

        toast({
          title: "Success",
          description: "Department updated successfully"
        });
      } else {
        // Create new department
        const { error } = await supabase
          .from('departments')
          .insert({
            name: departmentForm.name,
            description: departmentForm.description,
            company_id: company.id
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Department created successfully"
        });
      }

      resetDepartmentForm();
      fetchCompanyData();
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: "Error",
        description: "Failed to save department",
        variant: "destructive"
      });
    }
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      full_name: '',
      role: 'staff',
      department_id: 'no_department'
    });
    setEditingUser(null);
    setShowUserForm(false);
  };

  const resetDepartmentForm = () => {
    setDepartmentForm({
      name: '',
      description: ''
    });
    setEditingDepartment(null);
    setShowDepartmentForm(false);
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      full_name: user.full_name,
      role: user.role === 'company_owner' ? 'staff' : user.role, // Can't edit owner role
      department_id: user.department_id || 'no_department'
    });
    setShowUserForm(true);
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setDepartmentForm({
      name: dept.name,
      description: dept.description
    });
    setShowDepartmentForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .eq('company_id', company?.id); // Security: only delete users in own company

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully"
      });
      fetchCompanyData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!confirm('Are you sure you want to delete this department? This will affect all users in this department.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', deptId)
        .eq('company_id', company?.id); // Security: only delete departments in own company

      if (error) throw error;

      toast({
        title: "Success",
        description: "Department deleted successfully"
      });
      fetchCompanyData();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive"
      });
    }
  };

  if (!isCompanyOwner || !company) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Access denied. Only Company Owners can view this page.
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
          <h1 className="text-3xl font-bold">{company.name} - Company Dashboard</h1>
          <p className="text-muted-foreground">Manage your company and team</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUserForm(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
          <Button variant="outline" onClick={() => setShowDepartmentForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Company Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              Company divisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              Vendor partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Purchase orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/inventory')}>
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Manage Inventory</h3>
            <p className="text-sm text-muted-foreground">View and manage your products</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/suppliers')}>
          <CardContent className="p-6 text-center">
            <Truck className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Manage Suppliers</h3>
            <p className="text-sm text-muted-foreground">Handle vendor relationships</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/purchase-orders')}>
          <CardContent className="p-6 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Purchase Orders</h3>
            <p className="text-sm text-muted-foreground">Track and manage orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Management */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({companyUsers.length})</CardTitle>
          <CardDescription>Manage your company's users and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companyUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">
                        {user.role.replace('_', ' ')}
                      </Badge>
                      {user.department && (
                        <Badge variant="secondary">
                          {user.department.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditUser(user)}
                    disabled={user.role === 'company_owner'} // Can't edit owner
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.role === 'company_owner'} // Can't delete owner
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Departments Management */}
      <Card>
        <CardHeader>
          <CardTitle>Departments ({companyDepartments.length})</CardTitle>
          <CardDescription>Organize your company into departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companyDepartments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{dept.name}</h3>
                  <p className="text-sm text-muted-foreground">{dept.description}</p>
                  <div className="mt-2">
                    <Badge variant="outline">
                      {companyUsers.filter(u => u.department_id === dept.id).length} users
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditDepartment(dept)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteDepartment(dept.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Creation/Edit Form */}
      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information' : 'Add a new team member to your company'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={!!editingUser} // Can't change email for existing users
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value: 'department_manager' | 'staff') => 
                    setUserForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department_manager">Department Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department_id">Department</Label>
                <Select
                  value={userForm.department_id}
                  onValueChange={(value) => setUserForm(prev => ({ ...prev, department_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_department">No Department</SelectItem>
                    {companyDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetUserForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? 'Update User' : 'Add User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Department Creation/Edit Form */}
      <Dialog open={showDepartmentForm} onOpenChange={setShowDepartmentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment ? 'Update department information' : 'Create a new department in your company'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDepartmentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dept_name">Department Name *</Label>
              <Input
                id="dept_name"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Marketing, Sales, IT"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dept_description">Description</Label>
              <Input
                id="dept_description"
                value={departmentForm.description}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the department's purpose"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetDepartmentForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDepartment ? 'Update Department' : 'Add Department'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
