# 🔧 Troubleshooting Guide

## Google OAuth Issues

### Problem: Google Sign-in shows 500 error
**Solution:**
1. **Check Supabase Configuration:**
   - Go to your Supabase dashboard
   - Navigate to Authentication > Providers > Google
   - Ensure Google OAuth is enabled
   - Add your Vercel domain to redirect URLs:
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app`

2. **Check Environment Variables:**
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel
   - Verify the values match your Supabase project

3. **Alternative: Use Email/Password Sign-in**
   - Manual sign-in works perfectly
   - Use email verification for account creation

## Calculator Saving Issues

### Problem: Can't save calculators
**Debugging Steps:**
1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for error messages in Console tab
   - Check Network tab for failed requests

2. **Verify Authentication:**
   - Ensure you're signed in
   - Check if user session is active

3. **Check Database:**
   - Verify database migrations are run
   - Check if `calculators` table exists
   - Ensure RLS policies are correct

### Problem: Calculators not showing in Explore Gallery
**Debugging Steps:**
1. **Check Calculator Visibility:**
   - Ensure calculator is saved as "Public"
   - Check `is_public` field in database

2. **Refresh Gallery:**
   - Try switching tabs and back
   - Check if calculators appear after refresh

3. **Check Database:**
   - Verify `calculators` table has data
   - Check if `is_public = true` for gallery calculators

## Database Issues

### Problem: Tables not found
**Solution:**
1. **Run Migrations:**
   ```sql
   -- Run in Supabase SQL Editor
   -- First migration
   -- Copy content from supabase/migrations/20240101000000_create_tables.sql
   
   -- Second migration  
   -- Copy content from supabase/migrations/20240101000001_add_likes_views.sql
   ```

2. **Check RLS Policies:**
   - Ensure Row Level Security is enabled
   - Verify policies allow authenticated users to insert/select

## Environment Variables

### Required Variables in Vercel:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### How to Set:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable with correct values

## Common Error Messages

### "Authentication required"
- Sign in to your account
- Check if session is active

### "No calculator to save"
- Generate a calculator first
- Ensure AI generation completed successfully

### "Failed to save calculator"
- Check browser console for detailed error
- Verify database connection
- Ensure all required fields are filled

### "Error loading calculators"
- Check authentication status
- Verify database permissions
- Check network connection

## Testing Steps

### Test Authentication:
1. Try manual sign-in with email/password
2. Create a new account
3. Verify email (if required)
4. Test sign-out and sign-in again

### Test Calculator Creation:
1. Enter a prompt (e.g., "mortgage calculator")
2. Wait for AI generation
3. Test the calculator interface
4. Save as public calculator

### Test Gallery:
1. Switch to "Explore Gallery" tab
2. Check if saved calculators appear
3. Test search and filtering
4. Try liking calculators

## Getting Help

If issues persist:
1. Check browser console for errors
2. Verify all environment variables are set
3. Ensure database migrations are complete
4. Test with a fresh browser session
5. Check Supabase dashboard for errors
