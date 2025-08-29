import { useAuth } from '@/contexts/AuthContext';

export default function Test() {
  const { 
    user, 
    profile, 
    company, 
    department, 
    loading,
    isSuperAdmin,
    isCompanyOwner,
    isDepartmentManager,
    canModify
  } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Debug Information</h1>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">User Info</h2>
        <p><strong>User ID:</strong> {user?.id || 'None'}</p>
        <p><strong>Email:</strong> {user?.email || 'None'}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Profile Info</h2>
        <p><strong>Profile:</strong> {profile ? 'Loaded' : 'None'}</p>
        {profile && (
          <>
            <p><strong>Full Name:</strong> {profile.full_name}</p>
            <p><strong>Role:</strong> {profile.role}</p>
            <p><strong>Company ID:</strong> {profile.company_id}</p>
            <p><strong>Department ID:</strong> {profile.department_id || 'None'}</p>
            <p><strong>Is Active:</strong> {profile.is_active ? 'Yes' : 'No'}</p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Company Info</h2>
        <p><strong>Company:</strong> {company ? 'Loaded' : 'None'}</p>
        {company && (
          <>
            <p><strong>Company Name:</strong> {company.name}</p>
            <p><strong>Company ID:</strong> {company.id}</p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Department Info</h2>
        <p><strong>Department:</strong> {department ? 'Loaded' : 'None'}</p>
        {department && (
          <>
            <p><strong>Department Name:</strong> {department.name}</p>
            <p><strong>Department ID:</strong> {department.id}</p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Permission Checks</h2>
        <p><strong>isSuperAdmin:</strong> {isSuperAdmin ? 'Yes' : 'No'}</p>
        <p><strong>isCompanyOwner:</strong> {isCompanyOwner ? 'Yes' : 'No'}</p>
        <p><strong>isDepartmentManager:</strong> {isDepartmentManager ? 'Yes' : 'No'}</p>
        <p><strong>canModify:</strong> {canModify ? 'Yes' : 'No'}</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Raw Profile Data</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>
    </div>
  );
}
