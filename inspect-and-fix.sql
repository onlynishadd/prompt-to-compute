-- Run this in Supabase SQL Editor to inspect and fix your database

-- 1. First, let's see what columns exist in your calculators table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'calculators' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check existing policies on calculators table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'calculators';

-- 3. Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON calculators;
DROP POLICY IF EXISTS "Enable read access for all users" ON calculators;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON calculators;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON calculators;
DROP POLICY IF EXISTS "Users can insert own calculators" ON calculators;
DROP POLICY IF EXISTS "Public calculators are viewable by everyone" ON calculators;
DROP POLICY IF EXISTS "Users can update own calculators" ON calculators;
DROP POLICY IF EXISTS "Users can delete own calculators" ON calculators;

-- 4. Create simple, working policies
CREATE POLICY "Allow authenticated users to insert calculators" 
ON calculators FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own calculators or public ones" 
ON calculators FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Allow users to update their own calculators" 
ON calculators FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own calculators" 
ON calculators FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 5. Also create policies for profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Ensure the current user has a profile
INSERT INTO profiles (id, username, full_name, avatar_url)
SELECT 
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()), ''),
    COALESCE((SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE id = auth.uid()), '')
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid());
