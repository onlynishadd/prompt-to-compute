-- Minimal database fix - run this in Supabase SQL Editor

-- 1. Drop existing calculators table if it exists and recreate with proper schema
DROP TABLE IF EXISTS calculators CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create calculators table with all required columns
CREATE TABLE calculators (
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

-- 4. Insert profiles for existing users
INSERT INTO profiles (id, username, full_name, avatar_url)
SELECT 
    au.id,
    au.email as username,
    COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
    COALESCE(au.raw_user_meta_data->>'avatar_url', '') as avatar_url
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- 5. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculators ENABLE ROW LEVEL SECURITY;

-- 6. Create policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own calculators" ON calculators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public calculators are viewable by everyone" ON calculators FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can update own calculators" ON calculators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calculators" ON calculators FOR DELETE USING (auth.uid() = user_id);

-- 7. Create function for new user profile creation
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

-- 8. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
