-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calculators table
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

-- Create calculator_likes table
CREATE TABLE IF NOT EXISTS calculator_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    calculator_id UUID REFERENCES calculators(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, calculator_id)
);

-- Create calculator_forks table
CREATE TABLE IF NOT EXISTS calculator_forks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    original_calculator_id UUID REFERENCES calculators(id) ON DELETE CASCADE NOT NULL,
    forked_calculator_id UUID REFERENCES calculators(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, original_calculator_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calculators_user_id ON calculators(user_id);
CREATE INDEX IF NOT EXISTS idx_calculators_is_public ON calculators(is_public);
CREATE INDEX IF NOT EXISTS idx_calculators_is_template ON calculators(is_template);
CREATE INDEX IF NOT EXISTS idx_calculators_category ON calculators(category);
CREATE INDEX IF NOT EXISTS idx_calculators_created_at ON calculators(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculator_likes_user_id ON calculator_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_likes_calculator_id ON calculator_likes(calculator_id);
CREATE INDEX IF NOT EXISTS idx_calculator_forks_user_id ON calculator_forks(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_forks_original_id ON calculator_forks(original_calculator_id);

-- Function to increment calculator views
CREATE OR REPLACE FUNCTION increment_calculator_views(calculator_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE calculators 
  SET views_count = views_count + 1 
  WHERE id = calculator_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_calculator_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE calculators 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.calculator_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE calculators 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.calculator_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update forks count
CREATE OR REPLACE FUNCTION update_calculator_forks_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE calculators 
    SET forks_count = forks_count + 1 
    WHERE id = NEW.original_calculator_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE calculators 
    SET forks_count = forks_count - 1 
    WHERE id = OLD.original_calculator_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS calculator_likes_count_trigger ON calculator_likes;
CREATE TRIGGER calculator_likes_count_trigger
  AFTER INSERT OR DELETE ON calculator_likes
  FOR EACH ROW EXECUTE FUNCTION update_calculator_likes_count();

DROP TRIGGER IF EXISTS calculator_forks_count_trigger ON calculator_forks;
CREATE TRIGGER calculator_forks_count_trigger
  AFTER INSERT OR DELETE ON calculator_forks
  FOR EACH ROW EXECUTE FUNCTION update_calculator_forks_count();

-- Function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculators ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_forks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Calculators policies
CREATE POLICY "Public calculators are viewable by everyone" ON calculators FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own calculators" ON calculators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calculators" ON calculators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calculators" ON calculators FOR DELETE USING (auth.uid() = user_id);

-- Calculator likes policies
CREATE POLICY "Calculator likes are viewable by everyone" ON calculator_likes FOR SELECT USING (true);
CREATE POLICY "Users can like calculators" ON calculator_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike calculators" ON calculator_likes FOR DELETE USING (auth.uid() = user_id);

-- Calculator forks policies
CREATE POLICY "Calculator forks are viewable by everyone" ON calculator_forks FOR SELECT USING (true);
CREATE POLICY "Users can fork calculators" ON calculator_forks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own forks" ON calculator_forks FOR DELETE USING (auth.uid() = user_id);
