# Permission Debugging Guide

## Issue: "isCompanyOwner is not defined" Error

This error typically occurs when there are issues with:
1. Database role values not matching expected values
2. Profile data not loading correctly
3. Role checking logic failing

## Debugging Steps

### Step 1: Check the Test Page
Navigate to `/test` in your app to see detailed debug information about:
- User authentication status
- Profile data
- Role values
- Permission checks

### Step 2: Check Browser Console
Look for these console logs:
- `AuthContext: Role checks: {...}`
- `AuthContext: Profile fetched: {...}`
- Any error messages about invalid roles

### Step 3: Verify Database Role Values
In your Supabase SQL Editor, run:
```sql
SELECT id, email, role, company_id, is_active 
FROM profiles 
WHERE email = 'your-company-owner-email@example.com';
```

Expected role values:
- `super_admin` (not `super_admin`)
- `company_owner` (not `company_owner`)
- `department_manager` (not `department_manager`)
- `staff`

### Step 4: Check Profile Loading
In the browser console, look for:
```
AuthContext: Fetching profile for user: [user-id]
AuthContext: Profile fetched: {...}
```

## Common Issues and Fixes

### Issue 1: Role Values Mismatch
**Problem**: Database has `admin` instead of `super_admin`
**Fix**: Update the database:
```sql
UPDATE profiles 
SET role = 'super_admin' 
WHERE role = 'admin';
```

### Issue 2: Profile Not Loading
**Problem**: Profile query fails due to RLS policies
**Fix**: Check RLS policies on the `profiles` table

### Issue 3: Company/Department Data Missing
**Problem**: Profile loads but company/department data is null
**Fix**: Check foreign key relationships and RLS policies

## Testing the Fix

1. **Clear browser cache and cookies**
2. **Log out and log back in**
3. **Check the `/test` page for correct values**
4. **Verify console logs show proper role checking**

## Expected Console Output

When working correctly, you should see:
```
AuthContext: Role checks: {
  profile: "company_owner",
  isSuperAdmin: false,
  isCompanyOwner: true,
  isDepartmentManager: false,
  canModify: true
}
```

## Next Steps

If the issue persists:
1. Check the `/test` page output
2. Share the console logs
3. Verify database role values
4. Check RLS policies on the `profiles` table
