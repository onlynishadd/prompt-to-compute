-- Add like and view count columns to calculators table
ALTER TABLE public.calculators 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create calculator_likes table for tracking user likes
CREATE TABLE IF NOT EXISTS public.calculator_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calculator_id UUID REFERENCES public.calculators(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(calculator_id, user_id)
);

-- Create indexes for calculator_likes
CREATE INDEX IF NOT EXISTS idx_calculator_likes_calculator_id ON public.calculator_likes(calculator_id);
CREATE INDEX IF NOT EXISTS idx_calculator_likes_user_id ON public.calculator_likes(user_id);

-- Enable RLS on calculator_likes
ALTER TABLE public.calculator_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for calculator_likes
CREATE POLICY "Users can view all calculator likes" ON public.calculator_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON public.calculator_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.calculator_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_calculator_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.calculators 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.calculator_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.calculators 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.calculator_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating likes count
CREATE TRIGGER update_calculator_likes_count_trigger
    AFTER INSERT OR DELETE ON public.calculator_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_calculator_likes_count();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_calculator_views(calc_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.calculators 
    SET views_count = views_count + 1 
    WHERE id = calc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.increment_calculator_views(UUID) TO authenticated;
