# Everything Calculator Platform - Testing Guide

This guide will help you test all features of your Everything Calculator Platform step by step.

## Prerequisites

Before testing, ensure you have:

1. ✅ **Environment Variables Set Up**
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```

2. ✅ **Database Migrations Run**
   - Run `supabase/migrations/20240101000000_create_tables.sql`
   - Run `supabase/migrations/20240101000001_add_likes_views.sql`

3. ✅ **Supabase Auth Configured**
   - Enable Email provider in Supabase Auth settings
   - Enable Google OAuth provider (optional)
   - Set Site URL to `http://localhost:5173` for development

## 🧪 Step-by-Step Testing

### **Step 1: User Authentication Testing**

#### **1.1 User Registration**
1. Open the application in your browser
2. Click "Get Started" or "Sign In" button
3. Click "Sign up" link
4. Fill in the registration form:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
5. Click "Create Account"
6. **Expected Result**: 
   - ✅ Toast notification: "Account created! Please check your email to verify your account."
   - ✅ User profile created in database
   - ✅ User redirected to main page

#### **1.2 Email Verification**
1. Check your email for verification link
2. Click the verification link
3. **Expected Result**: 
   - ✅ User account verified
   - ✅ User can now sign in

#### **1.3 User Sign In**
1. Click "Sign In" button
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Sign In"
4. **Expected Result**: 
   - ✅ Toast notification: "Welcome back! You've been successfully signed in."
   - ✅ Header shows user menu instead of sign-in buttons
   - ✅ User session persists across page refresh

#### **1.4 Google OAuth (Optional)**
1. Click "Sign In" button
2. Click "Continue with Google"
3. **Expected Result**: 
   - ✅ Redirected to Google OAuth
   - ✅ After Google sign-in, user profile created
   - ✅ User signed in successfully

#### **1.5 Password Reset**
1. Click "Sign In" button
2. Click "Forgot your password?"
3. Enter email: `test@example.com`
4. Click "Send Reset Link"
5. **Expected Result**: 
   - ✅ Toast notification: "Password reset sent. Check your email for password reset instructions."
   - ✅ Email received with reset link

### **Step 2: AI Calculator Generation Testing**

#### **2.1 Basic Calculator Generation**
1. Ensure you're signed in
2. In the prompt input field, enter: `mortgage calculator`
3. Click "Generate Calculator" button
4. **Expected Result**: 
   - ✅ Loading state shows
   - ✅ Gemini API processes the request
   - ✅ Calculator specification generated
   - ✅ Live preview shows interactive calculator
   - ✅ Toast notification: "Calculator generated! Successfully created [title] calculator."

#### **2.2 Calculator Types Testing**
Test different calculator types:

**BMI Calculator:**
- Prompt: `BMI calculator with height and weight`
- **Expected Result**: ✅ Calculator with weight and height fields

**Tip Calculator:**
- Prompt: `tip calculator for restaurant bills`
- **Expected Result**: ✅ Calculator with bill amount and tip percentage fields

**ROI Calculator:**
- Prompt: `ROI calculator for investments`
- **Expected Result**: ✅ Calculator with investment and return fields

#### **2.3 Calculator Functionality**
1. Generate any calculator
2. Fill in the input fields with test values
3. Click the "Calculate" button
4. **Expected Result**: 
   - ✅ Calculation performed based on calculator type
   - ✅ Result displayed below the calculator
   - ✅ Different calculation logic for different calculator types

#### **2.4 AI Fallback Testing**
1. Temporarily remove or invalidate your Gemini API key
2. Try to generate a calculator
3. **Expected Result**: 
   - ✅ Fallback to sample loan calculator
   - ✅ Toast notification: "Using sample calculator (API unavailable)."

### **Step 3: Calculator Saving and Management**

#### **3.1 Save Calculator**
1. Generate a calculator
2. Click "Save Calculator" button
3. Enter title: `My Test Calculator`
4. Toggle "Make calculator public" if desired
5. Click "Save Calculator"
6. **Expected Result**: 
   - ✅ Toast notification: "Calculator saved! Your calculator has been saved successfully."
   - ✅ Calculator appears in "Your Calculators" section
   - ✅ Calculator saved to database

#### **3.2 View Saved Calculators**
1. Scroll down to "Your Calculators" section
2. **Expected Result**: 
   - ✅ All saved calculators displayed
   - ✅ Calculator title, prompt, and metadata shown
   - ✅ Like count and view count displayed (initially 0)
   - ✅ Public/private status indicator

#### **3.3 Calculator Actions**
For each saved calculator, test:

**Like Calculator:**
1. Click the heart icon
2. **Expected Result**: 
   - ✅ Toast notification: "Calculator liked! Thanks for your feedback."
   - ✅ Like count increments
   - ✅ Heart icon shows liked state

**Unlike Calculator:**
1. Click the heart icon again
2. **Expected Result**: 
   - ✅ Toast notification: "Like removed. Calculator unliked successfully."
   - ✅ Like count decrements

**Delete Calculator:**
1. Click the trash icon
2. Confirm deletion in the dialog
3. **Expected Result**: 
   - ✅ Toast notification: "Calculator deleted! Your calculator has been deleted successfully."
   - ✅ Calculator removed from list
   - ✅ Calculator deleted from database

### **Step 4: View Count Testing**

#### **4.1 View Count Increment**
1. Generate and save a calculator
2. Note the initial view count (should be 0)
3. Click "View" button on the calculator
4. **Expected Result**: 
   - ✅ View count increments by 1
   - ✅ View count persists across page refresh

### **Step 5: Cross-Device Authentication Testing**

#### **5.1 Session Persistence**
1. Sign in on one device/browser
2. Open the same application on another device/browser
3. **Expected Result**: 
   - ✅ User remains signed in on both devices
   - ✅ User data syncs across devices
   - ✅ Calculators saved on one device appear on the other

#### **5.2 Sign Out Testing**
1. Click user menu in header
2. Click "Log out"
3. **Expected Result**: 
   - ✅ Toast notification: "Signed out. You've been successfully signed out."
   - ✅ User redirected to main page
   - ✅ Header shows sign-in buttons
   - ✅ User data no longer accessible

### **Step 6: Error Handling Testing**

#### **6.1 Authentication Errors**
1. Try to sign in with wrong password
2. **Expected Result**: 
   - ✅ Error toast with specific error message
   - ✅ Form remains accessible for retry

#### **6.2 API Errors**
1. Try to save calculator without being signed in
2. **Expected Result**: 
   - ✅ Toast notification: "Authentication required. Please sign in to save calculators."

#### **6.3 Database Errors**
1. Try to like the same calculator twice
2. **Expected Result**: 
   - ✅ Toast notification: "Already liked. You've already liked this calculator."

## 🐛 Common Issues and Solutions

### **Issue: Authentication not working**
**Solution:**
- Check Supabase Auth settings
- Verify environment variables
- Ensure database migration ran successfully

### **Issue: AI generation not working**
**Solution:**
- Verify Gemini API key is valid
- Check API key permissions
- Ensure proper environment variable format

### **Issue: Database operations failing**
**Solution:**
- Run database migrations
- Check RLS policies
- Verify Supabase connection

### **Issue: Like/View counts not updating**
**Solution:**
- Ensure likes migration ran
- Check database triggers
- Verify RPC function permissions

## 📊 Testing Checklist

- [ ] User registration works
- [ ] Email verification works
- [ ] User sign in works
- [ ] Google OAuth works (if configured)
- [ ] Password reset works
- [ ] AI calculator generation works
- [ ] Different calculator types work
- [ ] Calculator calculations work
- [ ] Calculator saving works
- [ ] Calculator loading works
- [ ] Like functionality works
- [ ] Unlike functionality works
- [ ] View count works
- [ ] Delete functionality works
- [ ] Cross-device authentication works
- [ ] Error handling works
- [ ] Session persistence works
- [ ] Sign out works

## 🚀 Deployment Testing

After local testing, test on your Vercel deployment:

1. **Environment Variables**: Ensure all environment variables are set in Vercel
2. **Supabase Settings**: Update Site URL to your production domain
3. **Database**: Ensure migrations run on production database
4. **OAuth**: Update Google OAuth redirect URLs for production

## 📝 Test Results Log

Use this template to log your test results:

```
Test Date: _______________
Tester: _______________

✅ PASSED TESTS:
- [ ] User registration
- [ ] User sign in
- [ ] AI generation
- [ ] Calculator saving
- [ ] Like functionality
- [ ] View count
- [ ] Delete functionality
- [ ] Cross-device auth

❌ FAILED TESTS:
- [ ] Test name: Description of issue

🔧 ISSUES FOUND:
- Issue 1: Description
- Issue 2: Description

📋 NEXT STEPS:
- [ ] Fix identified issues
- [ ] Re-test failed functionality
- [ ] Deploy to production
```

This comprehensive testing guide ensures all features of your Everything Calculator Platform are working correctly before deployment.
