-- Fix Missing Database Tables
-- Run this in your Supabase SQL Editor to create the missing tables

-- First, check if the tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('calculator_likes', 'calculator_forks');

-- Create calculator_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.calculator_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  calculator_id uuid REFERENCES public.calculators(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, calculator_id)
);

-- Create calculator_forks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.calculator_forks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  original_calculator_id uuid REFERENCES public.calculators(id) ON DELETE CASCADE NOT NULL,
  forked_calculator_id uuid REFERENCES public.calculators(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, original_calculator_id, forked_calculator_id)
);

-- Enable Row Level Security on the new tables
ALTER TABLE public.calculator_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_forks ENABLE ROW LEVEL SECURITY;

-- Create policies for calculator_likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.calculator_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON public.calculator_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.calculator_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for calculator_forks
CREATE POLICY "Forks are viewable by everyone"
  ON public.calculator_forks FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own forks"
  ON public.calculator_forks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS calculator_likes_calculator_id_idx ON public.calculator_likes(calculator_id);
CREATE INDEX IF NOT EXISTS calculator_forks_original_calculator_id_idx ON public.calculator_forks(original_calculator_id);

-- Create functions to update counts
CREATE OR REPLACE FUNCTION public.update_calculator_likes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.calculators
    SET likes_count = likes_count + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.calculator_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.calculators
    SET likes_count = likes_count - 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = OLD.calculator_id;
    RETURN OLD;
  END IF;
  RETURN null;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_calculator_forks_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.calculators
    SET forks_count = forks_count + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.original_calculator_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.calculators
    SET forks_count = forks_count - 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = OLD.original_calculator_id;
    RETURN OLD;
  END IF;
  RETURN null;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS calculator_likes_count_trigger ON public.calculator_likes;
CREATE TRIGGER calculator_likes_count_trigger
  AFTER INSERT OR DELETE ON public.calculator_likes
  FOR EACH ROW EXECUTE PROCEDURE public.update_calculator_likes_count();

DROP TRIGGER IF EXISTS calculator_forks_count_trigger ON public.calculator_forks;
CREATE TRIGGER calculator_forks_count_trigger
  AFTER INSERT OR DELETE ON public.calculator_forks
  FOR EACH ROW EXECUTE PROCEDURE public.update_calculator_forks_count();

-- Create or update the increment views function
CREATE OR REPLACE FUNCTION public.increment_calculator_views(calculator_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.calculators 
  SET views_count = views_count + 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = calculator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the tables were created
SELECT 
  table_name, 
  CASE WHEN table_name IS NOT NULL THEN '✅ Created' ELSE '❌ Missing' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('calculator_likes', 'calculator_forks', 'calculators', 'profiles')
ORDER BY table_name;
