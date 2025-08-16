-- Add views, likes counting and sharing functionality
-- Run this in Supabase SQL Editor

-- 1. Create calculator_likes table
CREATE TABLE IF NOT EXISTS calculator_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    calculator_id UUID REFERENCES calculators(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, calculator_id)
);

-- 2. Create calculator_forks table (for future use)
CREATE TABLE IF NOT EXISTS calculator_forks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    original_calculator_id UUID REFERENCES calculators(id) ON DELETE CASCADE NOT NULL,
    forked_calculator_id UUID REFERENCES calculators(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, original_calculator_id)
);

-- 3. Create function to increment views
CREATE OR REPLACE FUNCTION increment_calculator_views(calculator_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE calculators 
  SET views_count = views_count + 1 
  WHERE id = calculator_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to update likes count
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

-- 5. Create function to update forks count
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

-- 6. Create triggers for automatic count updates
DROP TRIGGER IF EXISTS calculator_likes_count_trigger ON calculator_likes;
CREATE TRIGGER calculator_likes_count_trigger
  AFTER INSERT OR DELETE ON calculator_likes
  FOR EACH ROW EXECUTE FUNCTION update_calculator_likes_count();

DROP TRIGGER IF EXISTS calculator_forks_count_trigger ON calculator_forks;
CREATE TRIGGER calculator_forks_count_trigger
  AFTER INSERT OR DELETE ON calculator_forks
  FOR EACH ROW EXECUTE FUNCTION update_calculator_forks_count();

-- 7. Enable RLS on new tables
ALTER TABLE calculator_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_forks ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for calculator_likes
CREATE POLICY "Anyone can view likes" 
ON calculator_likes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can like calculators" 
ON calculator_likes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" 
ON calculator_likes FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 9. Create policies for calculator_forks
CREATE POLICY "Anyone can view forks" 
ON calculator_forks FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can fork calculators" 
ON calculator_forks FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own forks" 
ON calculator_forks FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calculator_likes_user_id ON calculator_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_likes_calculator_id ON calculator_likes(calculator_id);
CREATE INDEX IF NOT EXISTS idx_calculator_forks_user_id ON calculator_forks(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_forks_original_id ON calculator_forks(original_calculator_id);
