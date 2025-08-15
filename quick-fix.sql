-- Quick fix: Create profiles table and ensure proper relationships
-- Run this in your Supabase SQL editor

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert profile for current authenticated users who don't have one
INSERT INTO profiles (id, username, full_name, avatar_url)
SELECT 
    au.id,
    au.email as username,
    COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
    COALESCE(au.raw_user_meta_data->>'avatar_url', '') as avatar_url
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. Create or update the calculators table to use JSONB for spec
CREATE TABLE IF NOT EXISTS calculators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    spec JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    category TEXT,
    tags TEXT[],
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculators ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own calculators" ON calculators;
CREATE POLICY "Users can insert own calculators" ON calculators FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public calculators are viewable by everyone" ON calculators;
CREATE POLICY "Public calculators are viewable by everyone" ON calculators FOR SELECT USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calculators" ON calculators;
CREATE POLICY "Users can update own calculators" ON calculators FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calculators" ON calculators;
CREATE POLICY "Users can delete own calculators" ON calculators FOR DELETE USING (auth.uid() = user_id);

-- 6. Create function for auto profile creation
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

-- 7. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
