# 🔧 Database Fix Instructions

## Problem
The error "Could not find the table 'public.calculator_likes' in the schema cache" indicates that the required database tables are missing from your Supabase database.

## Solution

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Fix Script
1. Copy the entire content from `fix-database-tables.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### Step 3: Verify the Fix
The script will:
- ✅ Create missing `calculator_likes` table
- ✅ Create missing `calculator_forks` table  
- ✅ Set up Row Level Security policies
- ✅ Create database triggers for automatic counting
- ✅ Create the view increment function
- ✅ Show a verification query at the end

### Step 4: Test the Application
1. Refresh your application
2. Try clicking the **Like** button
3. The error should be gone and likes should work properly

## What the Script Does

### Creates Missing Tables:
```sql
-- calculator_likes table for storing user likes
CREATE TABLE public.calculator_likes (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  calculator_id uuid REFERENCES calculators(id),
  created_at timestamp,
  UNIQUE(user_id, calculator_id)
);

-- calculator_forks table for storing calculator forks
CREATE TABLE public.calculator_forks (
  id uuid PRIMARY KEY, 
  user_id uuid REFERENCES profiles(id),
  original_calculator_id uuid REFERENCES calculators(id),
  forked_calculator_id uuid REFERENCES calculators(id),
  created_at timestamp,
  UNIQUE(user_id, original_calculator_id, forked_calculator_id)
);
```

### Sets Up Security:
- Row Level Security (RLS) policies
- Users can only like/unlike for themselves
- All users can view likes and forks

### Creates Automatic Counting:
- Database triggers that automatically update `likes_count` when likes are added/removed
- Database triggers that automatically update `forks_count` when forks are created
- Function to increment `views_count` when calculators are viewed

## Expected Result
After running this script:
- ❤️ **Like buttons work** - Users can like/unlike calculators
- 🔄 **Counts update automatically** - Like counts, fork counts, and view counts work
- 🛡️ **Security enabled** - Proper RLS policies in place
- ⚡ **Performance optimized** - Database indexes for fast queries

## If You Still Have Issues
1. Check that your Supabase project has the correct permissions
2. Ensure you're signed in to Supabase dashboard with proper access
3. Verify your environment variables in `.env` are correct:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Alternative: Manual Migration
If the SQL script doesn't work, you can run the original migration:
1. Copy content from `supabase/migrations/20240114000000_calculator_platform.sql`
2. Run it in the SQL Editor
3. This will set up the entire database schema from scratch
