# 🚀 Multi-Tenancy Setup Guide

## **Overview**
This guide will help you set up the multi-tenant system for InventaSupply. The system now supports:
- Multiple companies with isolated data
- Hierarchical user roles (Super Admin, Company Owner, Department Manager, Staff)
- Company-specific departments and user management
- Row-level security for data isolation

## **🔧 Database Setup**

### **Step 1: Apply Database Migrations**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the following migrations in order:**

#### **Migration 1: Multi-Tenancy Structure**
```sql
-- Copy and paste the content from: supabase/migrations/20250828160000_add_multi_tenancy.sql
```

#### **Migration 2: RLS Policies**
```sql
-- Copy and paste the content from: supabase/migrations/20250828160001_add_rls_policies.sql
```

### **Step 2: Verify Setup**
After running the migrations, you should see:
- New `companies` and `departments` tables
- Updated `profiles` table with new columns
- All existing tables now have `company_id` column
- RLS policies enabled on all tables

## **👥 User Role System**

### **Role Hierarchy:**
1. **Super Admin** (You)
   - Can view and manage ALL companies
   - Full system access
   - Can create new companies

2. **Company Owner/Manager**
   - Manages their own company
   - Can create departments and assign users
   - Full access to company data

3. **Department Manager**
   - Manages their department
   - Can view and modify department-related data
   - Limited company-wide access

4. **Staff**
   - Basic user access
   - Can view assigned data
   - Limited modification permissions

## **🏢 Company Management**

### **For Super Admins:**
- Access `/company-management` route
- Create new companies
- View all company data
- Manage company settings

### **For Company Owners:**
- Manage company departments
- Add/remove users
- Assign user roles
- Configure company settings

## **🔐 Security Features**

- **Row-Level Security (RLS)** ensures data isolation
- Users can only access data from their company
- Role-based permissions control data access
- Automatic company context detection

## **📱 New Features Added**

1. **Company Management Page** (`/company-management`)
   - Create, edit, delete companies
   - View company details and users
   - Manage company departments

2. **Updated Sidebar**
   - Company management link for Super Admins
   - Role-based navigation items

3. **Enhanced User Profiles**
   - Company and department association
   - Role-based permissions
   - Company context awareness

## **⚠️ Important Notes**

1. **Existing Data**: All existing data has been assigned to a "Default Company"
2. **User Roles**: Existing users are set as "Super Admin" by default
3. **Data Isolation**: New companies will have completely isolated data
4. **Backup**: Consider backing up your database before applying migrations

## **🚀 Next Steps**

After setup, you can:
1. **Create new companies** through the Company Management page
2. **Add users** to companies (they'll need to sign in with existing credentials)
3. **Customize departments** for each company
4. **Scale** to multiple companies as needed

## **🆘 Troubleshooting**

### **Common Issues:**

1. **"Access denied" errors**
   - Check if RLS policies are properly applied
   - Verify user has correct role and company assignment

2. **Data not showing**
   - Ensure `company_id` is set on all records
   - Check RLS policies are working correctly

3. **Permission errors**
   - Verify user role in profiles table
   - Check company_id assignment

### **Need Help?**
- Check Supabase logs for detailed error messages
- Verify all migrations ran successfully
- Ensure RLS is enabled on all tables

## **🎯 Success Indicators**

✅ Companies table created with sample data  
✅ All existing tables have company_id column  
✅ RLS policies are active  
✅ Company Management page accessible  
✅ Users can only see their company data  
✅ Role-based permissions working  

---

**🎉 Congratulations! You now have a multi-tenant supply chain management system!**
