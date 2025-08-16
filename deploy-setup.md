# Deployment Setup Guide - Fixing Authentication Issues

## Problem Summary
Your deployed application on Vercel is facing authentication issues where new users aren't being added when opened on other devices. This is because:

1. **No authentication system was implemented** - The app only had Supabase client setup but no auth UI
2. **Missing database tables** - No users or calculators tables existed
3. **No user management** - No sign-in/sign-up functionality

## What I've Fixed

### ✅ Complete Authentication System
- **Sign Up Form** - Users can create accounts with email/password
- **Sign In Form** - Existing users can authenticate
- **Password Reset** - Users can reset forgotten passwords
- **User Menu** - Profile management and logout functionality
- **Session Management** - Persistent authentication across devices

### ✅ Database Setup
- **Users Table** - Stores user profiles and authentication data
- **Calculators Table** - Stores user-generated calculators
- **Row Level Security** - Ensures data privacy and security
- **Automatic Triggers** - Creates user profiles on signup

### ✅ UI Components
- **Header with Auth** - Shows sign-in/sign-up buttons or user menu
- **Auth Modal** - Beautiful modal for authentication forms
- **Save Calculator** - Users can save their generated calculators
- **User Dashboard** - View saved calculators

## Deployment Steps

### 1. Update Supabase Database
Run this SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calculators table
CREATE TABLE IF NOT EXISTS public.calculators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    spec JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculators ENABLE ROW LEVEL SECURITY;

-- Create policies (run the full migration from supabase/migrations/20240101000000_create_tables.sql)
```

### 2. Update Vercel Environment Variables
In your Vercel dashboard, ensure these environment variables are set:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

### 3. Update Supabase Auth Settings
In your Supabase dashboard:
1. Go to Authentication > Settings
2. Add your Vercel domain to "Site URL" (e.g., `https://your-app.vercel.app`)
3. Add redirect URLs for password reset

### 4. Deploy the Updated Code
The updated code includes:
- Complete authentication system
- Database integration
- User management
- Calculator saving functionality

## Testing the Fix

### 1. Test User Registration
- Open your deployed app
- Click "Get Started" or "Sign In"
- Create a new account
- Verify email confirmation works

### 2. Test Cross-Device Authentication
- Sign in on one device
- Open the app on another device
- User should remain signed in (if using same browser)
- Sign in should work on new devices

### 3. Test Calculator Saving
- Generate a calculator
- Sign in (if not already)
- Click "Save Calculator"
- Verify it appears in "Your Calculators" section

## Common Issues & Solutions

### Issue: "Authentication required" error
**Solution**: Ensure Supabase auth is properly configured and environment variables are set

### Issue: Users not being created in database
**Solution**: Run the database migration and ensure the trigger function is created

### Issue: Sign-in not working on different devices
**Solution**: Check Supabase auth settings and ensure proper redirect URLs

### Issue: Calculators not saving
**Solution**: Verify database tables exist and RLS policies are correct

## Monitoring

After deployment, monitor:
1. **Supabase Dashboard** - Check for auth errors
2. **Vercel Logs** - Look for build or runtime errors
3. **Browser Console** - Check for JavaScript errors
4. **Database** - Verify users and calculators are being created

## Next Steps

Once authentication is working:
1. **Test thoroughly** on different devices and browsers
2. **Monitor usage** through Supabase analytics
3. **Consider adding** email verification requirements
4. **Implement** more advanced features like social login

The authentication system is now complete and should resolve the cross-device user management issues you were experiencing.

