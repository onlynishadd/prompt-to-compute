import { supabase } from '@/integrations/supabase/client'

export interface Calculator {
  id: string
  user_id: string
  title: string
  description?: string
  prompt: string
  spec: any
  is_public: boolean
  is_template: boolean
  category?: string
  tags?: string[]
  views_count: number
  likes_count: number
  forks_count: number
  created_at: string
  updated_at: string
  profile?: {
    id: string
    username?: string
    full_name?: string
    avatar_url?: string
  }
  is_liked?: boolean
  is_forked?: boolean
}

export interface CreateCalculatorData {
  title: string
  description?: string
  prompt: string
  spec: any
  is_public?: boolean
  is_template?: boolean
  category?: string
  tags?: string[]
}

export interface UpdateCalculatorData extends Partial<CreateCalculatorData> {
  id: string
}

export const calculatorService = {
  async createCalculator(data: CreateCalculatorData): Promise<{ data: Calculator | null; error: any }> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { data: null, error: { message: 'User not authenticated' } }
    }

    try {
      // First, ensure user has a profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.user.id)
        .single()

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.user.id,
            username: user.user.email,
            full_name: user.user.user_metadata?.full_name || '',
            avatar_url: user.user.user_metadata?.avatar_url || ''
          })
        
        if (profileError) {
          console.error('Profile creation error:', profileError)
        }
      }

      // Insert calculator
      const { data: calculator, error } = await supabase
        .from('calculators')
        .insert({
          ...data,
          user_id: user.user.id,
        })
        .select('*')
        .single()

      if (error) {
        return { data: null, error }
      }

      // Try to get profile data separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', user.user.id)
        .single()

      return { 
        data: {
          ...calculator,
          profile: profile || null
        }, 
        error: null 
      }
    } catch (err) {
      console.error('Create calculator error:', err)
      return { data: null, error: err }
    }
  },

  async updateCalculator(data: UpdateCalculatorData): Promise<{ data: Calculator | null; error: any }> {
    const { id, ...updateData } = data
    const { data: calculator, error } = await supabase
      .from('calculators')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        profile:profiles(id, username, full_name, avatar_url)
      `)
      .single()

    return { data: calculator, error }
  },

  async deleteCalculator(id: string): Promise<{ error: any }> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { error: { message: 'User not authenticated' } }
    }

    // First verify the calculator belongs to the authenticated user
    const { data: calculator, error: fetchError } = await supabase
      .from('calculators')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      return { error: fetchError }
    }

    if (!calculator || calculator.user_id !== user.user.id) {
      return { error: { message: 'You can only delete your own calculators' } }
    }

    // Delete the calculator
    const { error } = await supabase
      .from('calculators')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id) // Additional safety check

    return { error }
  },

  async getCalculator(id: string): Promise<{ data: Calculator | null; error: any }> {
    const { data: user } = await supabase.auth.getUser()
    
    // Increment view count first
    const { error: viewError } = await supabase.rpc('increment_calculator_views', { calculator_id: id })
    if (viewError) {
      console.error('Error incrementing view count:', viewError)
    }
    
    // Small delay to ensure database trigger has completed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const { data: calculator, error } = await supabase
      .from('calculators')
      .select(`
        *,
        profile:profiles(id, username, full_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (calculator && user.user) {
      // Check if user has liked this calculator
      const { data: likeData } = await supabase
        .from('calculator_likes')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('calculator_id', id)
        .single()

      calculator.is_liked = !!likeData

      // Check if user has forked this calculator
      const { data: forkData } = await supabase
        .from('calculator_forks')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('original_calculator_id', id)
        .single()

      calculator.is_forked = !!forkData
    }

    return { data: calculator, error }
  },

  async getCalculators(filters: {
    userId?: string
    isPublic?: boolean
    isTemplate?: boolean
    category?: string
    search?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ data: Calculator[] | null; error: any }> {
    const { data: user } = await supabase.auth.getUser()
    
    let query = supabase
      .from('calculators')
      .select(`
        *,
        profile:profiles(id, username, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic)
    }

    if (filters.isTemplate !== undefined) {
      query = query.eq('is_template', filters.isTemplate)
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data: calculators, error } = await query

    // Add like/fork status for authenticated users
    if (calculators && user.user) {
      const calculatorIds = calculators.map(c => c.id)
      
      const { data: likes } = await supabase
        .from('calculator_likes')
        .select('calculator_id')
        .eq('user_id', user.user.id)
        .in('calculator_id', calculatorIds)

      const { data: forks } = await supabase
        .from('calculator_forks')
        .select('original_calculator_id')
        .eq('user_id', user.user.id)
        .in('original_calculator_id', calculatorIds)

      const likedIds = new Set(likes?.map(l => l.calculator_id) || [])
      const forkedIds = new Set(forks?.map(f => f.original_calculator_id) || [])

      calculators.forEach(calculator => {
        calculator.is_liked = likedIds.has(calculator.id)
        calculator.is_forked = forkedIds.has(calculator.id)
      })
    }

    return { data: calculators, error }
  },

  async getUserCalculators(userId: string): Promise<{ data: Calculator[] | null; error: any }> {
    return this.getCalculators({ userId })
  },

  async getPublicCalculators(limit = 20, offset = 0): Promise<{ data: Calculator[] | null; error: any }> {
    return this.getCalculators({ isPublic: true, limit, offset })
  },

  async getTemplateCalculators(limit = 20, offset = 0): Promise<{ data: Calculator[] | null; error: any }> {
    return this.getCalculators({ isTemplate: true, isPublic: true, limit, offset })
  },

  async likeCalculator(calculatorId: string): Promise<{ error: any }> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { error: { message: 'User not authenticated' } }
    }

    const { error } = await supabase
      .from('calculator_likes')
      .insert({
        user_id: user.user.id,
        calculator_id: calculatorId,
      })

    return { error }
  },

  async unlikeCalculator(calculatorId: string): Promise<{ error: any }> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { error: { message: 'User not authenticated' } }
    }

    const { error } = await supabase
      .from('calculator_likes')
      .delete()
      .eq('user_id', user.user.id)
      .eq('calculator_id', calculatorId)

    return { error }
  },

  async forkCalculator(originalCalculatorId: string): Promise<{ data: Calculator | null; error: any }> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { data: null, error: { message: 'User not authenticated' } }
    }

    // Get original calculator
    const { data: originalCalculator, error: fetchError } = await this.getCalculator(originalCalculatorId)
    if (fetchError || !originalCalculator) {
      return { data: null, error: fetchError || { message: 'Calculator not found' } }
    }

    // Create forked calculator
    const { data: forkedCalculator, error: createError } = await this.createCalculator({
      title: `${originalCalculator.title} (Fork)`,
      description: originalCalculator.description,
      prompt: originalCalculator.prompt,
      spec: originalCalculator.spec,
      is_public: false,
      category: originalCalculator.category,
      tags: originalCalculator.tags,
    })

    if (createError || !forkedCalculator) {
      return { data: null, error: createError }
    }

    // Record the fork relationship
    const { error: forkError } = await supabase
      .from('calculator_forks')
      .insert({
        user_id: user.user.id,
        original_calculator_id: originalCalculatorId,
        forked_calculator_id: forkedCalculator.id,
      })

    if (forkError) {
      // Clean up the created calculator if fork recording fails
      await this.deleteCalculator(forkedCalculator.id)
      return { data: null, error: forkError }
    }

    return { data: forkedCalculator, error: null }
  },

  async searchCalculators(query: string, limit = 20, offset = 0): Promise<{ data: Calculator[] | null; error: any }> {
    return this.getCalculators({ search: query, isPublic: true, limit, offset })
  },

  async getCalculatorsByCategory(category: string, limit = 20, offset = 0): Promise<{ data: Calculator[] | null; error: any }> {
    return this.getCalculators({ category, isPublic: true, limit, offset })
  },
}

// Helper function for view count increment
export const createIncrementViewsFunction = `
CREATE OR REPLACE FUNCTION increment_calculator_views(calculator_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE calculators 
  SET views_count = views_count + 1 
  WHERE id = calculator_id;
END;
$$ LANGUAGE plpgsql;
`
