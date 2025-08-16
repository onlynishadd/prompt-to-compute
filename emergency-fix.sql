-- EMERGENCY FIX: Temporarily disable RLS to test saving
-- Run this in Supabase SQL Editor, then try saving a calculator

-- Temporarily disable RLS on calculators table for testing
ALTER TABLE calculators DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Enable it back after testing (run this after you confirm saving works)
-- ALTER TABLE calculators ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
