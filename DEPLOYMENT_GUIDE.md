# 🚀 Everything Calculator Platform - Deployment Guide

This guide will help you deploy your Everything Calculator Platform to Vercel.

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ **GitHub Repository** - Your code is pushed to GitHub
2. ✅ **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. ✅ **Supabase Project** - Set up at [supabase.com](https://supabase.com)
4. ✅ **Google AI Studio Account** - For Gemini API key

## 🔧 Step 1: Set Up Environment Variables

### **Create .env.local file**
Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Gemini API Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### **Get Your API Keys**

#### **Supabase Setup:**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings > API
3. Copy your Project URL and anon key
4. Update `.env.local` with these values

#### **Gemini API Setup:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key
4. Update `.env.local` with this value

## 🗄️ Step 2: Set Up Database

### **Run Database Migrations**
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run these migrations in order:

**First Migration:**
```sql
-- Run supabase/migrations/20240101000000_create_tables.sql
```

**Second Migration:**
```sql
-- Run supabase/migrations/20240101000001_add_likes_views.sql
```

### **Configure Authentication**
1. In Supabase dashboard, go to Authentication > Settings
2. Set Site URL to your Vercel domain (we'll get this after deployment)
3. Enable Email provider
4. Enable Google OAuth (optional)

## 🚀 Step 3: Deploy to Vercel

### **Method 1: Deploy via Vercel Dashboard (Recommended)**

1. **Connect GitHub Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository: `onlynishadd/prompt-to-compute`

2. **Configure Project:**
   - Framework Preset: `Vite`
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)

3. **Set Environment Variables:**
   - Click "Environment Variables"
   - Add each variable from your `.env.local`:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_GEMINI_API_KEY`

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

### **Method 2: Deploy via Vercel CLI**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set Environment Variables:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_GEMINI_API_KEY
   ```

## 🔗 Step 4: Configure Supabase for Production

### **Update Site URL**
1. Go to your Supabase dashboard
2. Navigate to Authentication > Settings
3. Update Site URL to your Vercel domain (e.g., `https://your-app.vercel.app`)

### **Update Redirect URLs (if using Google OAuth)**
1. In Supabase dashboard, go to Authentication > Providers > Google
2. Add your Vercel domain to redirect URLs:
   - `https://your-app.vercel.app/auth/callback`

## 🧪 Step 5: Test Your Deployment

### **Test Authentication:**
1. Visit your Vercel URL
2. Try to register a new user
3. Verify email verification works
4. Test sign in functionality

### **Test AI Generation:**
1. Sign in to your account
2. Enter a prompt like "mortgage calculator"
3. Verify calculator generation works
4. Test saving and loading calculators

### **Test Database Operations:**
1. Save a calculator
2. Test like functionality
3. Test delete functionality
4. Verify view counts work

## 🔧 Step 6: Troubleshooting

### **Common Issues:**

#### **Build Fails:**
- Check environment variables are set correctly
- Verify all dependencies are in `package.json`
- Check for TypeScript errors

#### **Authentication Not Working:**
- Verify Supabase URL and anon key
- Check Site URL in Supabase settings
- Ensure database migrations ran successfully

#### **AI Generation Not Working:**
- Verify Gemini API key is valid
- Check API key permissions
- Ensure proper environment variable format

#### **Database Operations Failing:**
- Run database migrations
- Check RLS policies
- Verify Supabase connection

## 📊 Step 7: Monitor Your Deployment

### **Vercel Analytics:**
- Monitor page views and performance
- Check for build errors
- Review deployment logs

### **Supabase Monitoring:**
- Monitor database performance
- Check authentication logs
- Review API usage

## 🔄 Step 8: Continuous Deployment

### **Automatic Deployments:**
- Every push to `main` branch will trigger a new deployment
- Vercel will automatically build and deploy your changes

### **Environment Variables:**
- Update environment variables in Vercel dashboard as needed
- No need to redeploy for environment variable changes

## 📝 Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database migrations run in Supabase
- [ ] Supabase Site URL updated
- [ ] Authentication providers configured
- [ ] Build completes successfully
- [ ] Authentication flow works
- [ ] AI generation works
- [ ] Database operations work
- [ ] Cross-device sync works

## 🎉 Success!

Your Everything Calculator Platform is now deployed and running! 

**Your app URL:** `https://your-app.vercel.app`

Share this URL with users and start generating calculators!

## 📞 Support

If you encounter any issues:
1. Check the Vercel deployment logs
2. Review Supabase dashboard for errors
3. Test locally with the same environment variables
4. Refer to the `TESTING_GUIDE.md` for comprehensive testing steps
