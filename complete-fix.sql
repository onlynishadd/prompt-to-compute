-- COMPLETE FIX: Reset and properly configure the database
-- Run this in Supabase SQL Editor

-- 1. First, let's completely disable RLS and drop all policies
ALTER TABLE calculators DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'calculators'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON calculators';
    END LOOP;
END $$;

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
END $$;

-- 3. Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Check if calculators table has the required columns, add them if missing
DO $$
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculators' AND column_name='category') THEN
        ALTER TABLE calculators ADD COLUMN category TEXT;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculators' AND column_name='tags') THEN
        ALTER TABLE calculators ADD COLUMN tags TEXT[];
    END IF;
    
    -- Add views_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculators' AND column_name='views_count') THEN
        ALTER TABLE calculators ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add likes_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculators' AND column_name='likes_count') THEN
        ALTER TABLE calculators ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add forks_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculators' AND column_name='forks_count') THEN
        ALTER TABLE calculators ADD COLUMN forks_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 5. Insert profile for all existing users who don't have one
INSERT INTO profiles (id, username, full_name, avatar_url)
SELECT 
    au.id,
    au.email as username,
    COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
    COALESCE(au.raw_user_meta_data->>'avatar_url', '') as avatar_url
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. Create a function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. Now let's test without RLS first
-- Leave RLS disabled for now so you can test saving

-- 9. Create simple policies that should work
CREATE POLICY "Allow all authenticated users to do everything on calculators" 
ON calculators FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to do everything on profiles" 
ON profiles FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 10. Enable RLS back
-- ALTER TABLE calculators ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Test first with RLS disabled, then uncomment the lines above to enable it back
