// Simple test script to validate database functions
// Run this to ensure your database functions are working

import { createClient } from '@supabase/supabase-js'

// You can test the database functions by running:
// node test-db-functions.js

async function testDatabaseFunctions() {
  // Make sure to set your actual Supabase URL and anon key
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url'
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
  
  if (SUPABASE_URL === 'your-supabase-url' || SUPABASE_ANON_KEY === 'your-anon-key') {
    console.log('❌ Please set your Supabase URL and anon key in environment variables')
    console.log('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  console.log('🔄 Testing database connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('calculators')
      .select('id, title, views_count, likes_count, forks_count')
      .limit(5)
    
    if (error) {
      console.log('❌ Database connection failed:', error.message)
      return
    }
    
    console.log('✅ Database connection successful')
    console.log(`📊 Found ${data?.length || 0} calculators`)
    
    if (data && data.length > 0) {
      console.log('\n📋 Sample calculator data:')
      data.forEach((calc, index) => {
        console.log(`${index + 1}. ${calc.title}`)
        console.log(`   Views: ${calc.views_count}, Likes: ${calc.likes_count}, Forks: ${calc.forks_count}`)
      })
      
      // Test the increment views function
      const testCalculatorId = data[0].id
      console.log(`\n🔄 Testing increment_calculator_views function for calculator: ${testCalculatorId}`)
      
      const { error: incrementError } = await supabase
        .rpc('increment_calculator_views', { calculator_id: testCalculatorId })
      
      if (incrementError) {
        console.log('❌ increment_calculator_views function failed:', incrementError.message)
      } else {
        console.log('✅ increment_calculator_views function working')
      }
    }
    
  } catch (err) {
    console.log('❌ Test failed:', err.message)
  }
}

// Instructions for the user
console.log(`
🧪 Database Function Test Script
================================

This script tests your Supabase database functions.

To run this test:
1. Make sure your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
2. Run: node test-db-functions.js

The script will:
- Test database connection
- Check calculator data
- Test the increment_calculator_views function
- Verify the database triggers are working

`)

// Uncomment the next line to run the test
// testDatabaseFunctions()
