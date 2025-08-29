# Invite Email Setup Guide

## Overview
This guide explains how to set up automatic email delivery for user invitations using Google SMTP and Supabase Edge Functions.

## What's Been Set Up

### 1. Edge Function (`supabase/functions/send-invite/index.ts`)
- **Purpose**: Sends invitation emails when new invites are created
- **SMTP Provider**: Google Gmail
- **Configuration**:
  - Host: `smtp.gmail.com`
  - Port: `587`
  - Username: `theolusmpanza@gmail.com`
  - Password: `yssb iwue wxte wesr` (App password with spaces)

### 2. Database Trigger (`supabase/migrations/20250828170800_invite_email_trigger.sql`)
- **Purpose**: Automatically calls the Edge Function when an invite is inserted
- **Trigger**: `AFTER INSERT ON public.invites`
- **Function**: `send_invite_email()`

### 3. Enhanced AcceptInvite Component
- **Purpose**: Improved error handling and debugging for invite acceptance
- **Features**: Console logging, better error messages, loading states

## Deployment Steps

### Step 1: Deploy the Edge Function
```bash
# In your Supabase project directory
supabase functions deploy send-invite
```

### Step 2: Run Database Migrations
Execute these SQL files in your Supabase SQL Editor in order:
1. `20250828170600_adjust_invites_rls.sql` - Fixes RLS for invite reading
2. `20250828170700_profiles_self_insert.sql` - Allows profile creation
3. `20250828170800_invite_email_trigger.sql` - Creates email trigger

### Step 3: Test the System
1. Create a new user invitation in the app
2. Check if the email is sent automatically
3. Test the invite acceptance flow

## Email Template
The invitation email includes:
- Personalized greeting with role and company name
- Direct link to accept invitation
- Expiration notice (7 days)
- Contact information for support

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check Edge Function logs in Supabase dashboard
2. **SMTP errors**: Verify Google App password is correct
3. **Invite acceptance fails**: Check browser console for detailed error logs

### Debug Mode
The AcceptInvite component now includes extensive console logging to help diagnose issues.

## Security Notes
- Google App password is used instead of regular password
- Edge Function is protected by Supabase service role key
- Database trigger uses SECURITY DEFINER for proper permissions

## Next Steps
1. Test the complete flow end-to-end
2. Customize email templates if needed
3. Monitor Edge Function performance and logs
4. Consider adding email delivery tracking
