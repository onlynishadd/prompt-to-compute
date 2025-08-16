import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CalculatorState {
  prompt: string;
  generating: boolean;
  spec: string | null;
  savedCalculators: any[];
  loadingCalculators: boolean;
  setPrompt: (v: string) => void;
  generate: () => Promise<void>;
  saveCalculator: (title: string, isPublic?: boolean) => Promise<void>;
  loadUserCalculators: () => Promise<void>;
  likeCalculator: (calculatorId: string) => Promise<void>;
  unlikeCalculator: (calculatorId: string) => Promise<void>;
  incrementViews: (calculatorId: string) => Promise<void>;
  deleteCalculator: (calculatorId: string) => Promise<void>;
  reset: () => void;
}

// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  prompt: "",
  generating: false,
  spec: null,
  savedCalculators: [],
  loadingCalculators: false,
  setPrompt: (v) => set({ prompt: v }),
  reset: () => set({ prompt: "", generating: false, spec: null }),
  
  generate: async () => {
    if (get().generating) return;
    set({ generating: true, spec: null }); // Also reset previous spec

    try {
      const prompt = get().prompt;
      
      if (!prompt.trim()) {
        console.error("Prompt is empty, cannot generate.");
        return;
      }
      
      if (!GEMINI_API_KEY) {
        throw new Error("Gemini API key not configured");
      }

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a calculator specification based on this prompt: "${prompt}"

Please return a JSON object with the following structure:
{
  "title": "Calculator Title",
  "fields": [
    {
      "id": "field_id",
      "label": "Field Label",
      "type": "number|text|select",
      "placeholder": "Placeholder text",
      "options": ["option1", "option2"] // only for select type
    }
  ],
  "formula": "JavaScript formula or calculation logic",
  "cta": "Calculate Button Text",
  "description": "Brief description of what this calculator does"
}

Make sure the response is valid JSON only, no additional text.`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response from Gemini API");
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Try to extract JSON from the response
      let jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from Gemini response");
      }

      const calculatorSpec = JSON.parse(jsonMatch[0]);
      
      // Validate the spec structure
      if (!calculatorSpec.title || !calculatorSpec.fields || !Array.isArray(calculatorSpec.fields)) {
        throw new Error("Invalid calculator specification structure");
      }

      set({ spec: JSON.stringify(calculatorSpec, null, 2), generating: false });
      
      toast({
        title: "Calculator generated!",
        description: `Successfully created "${calculatorSpec.title}" calculator.`,
      });

    } catch (error) {
      console.error('Error generating calculator:', error);
      
      // Fallback to sample data if API fails
      const sampleSpec = {
        title: "Loan Payment Calculator",
        fields: [
          { id: "amount", label: "Amount", type: "number", placeholder: "20000" },
          { id: "rate", label: "APR %", type: "number", placeholder: "6.5" },
          { id: "term", label: "Years", type: "number", placeholder: "5" },
        ],
        formula: "PMT((rate/100)/12, term*12, -amount)",
        cta: "Calculate Payment",
        description: "Calculate monthly loan payments based on principal, interest rate, and term."
      };

      set({ spec: JSON.stringify(sampleSpec, null, 2), generating: false });
      
      toast({
        title: "Generation completed",
        description: "Using sample calculator (API unavailable).",
        variant: "default",
      });
    }
  },

  saveCalculator: async (title: string, isPublic = false) => {
    const { spec, prompt } = get();
    if (!spec) {
      toast({
        title: "No calculator to save",
        description: "Please generate a calculator first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save calculators.",
          variant: "destructive",
        });
        return;
      }

      console.log('Saving calculator:', { title, isPublic, user: user.id });
      console.log('Calculator spec:', spec);

      const calculatorData = {
        user_id: user.id,
        title,
        prompt,
        spec: JSON.parse(spec),
        is_public: isPublic,
        slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      };

      console.log('Calculator data to insert:', calculatorData);

      const { data, error } = await supabase
        .from('calculators')
        .insert(calculatorData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Calculator saved successfully:', data);

      toast({
        title: "Calculator saved!",
        description: "Your calculator has been saved successfully.",
      });

      // Reload user calculators
      get().loadUserCalculators();
    } catch (error) {
      console.error('Error saving calculator:', error);
      toast({
        title: "Save failed",
        description: `Failed to save calculator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  },

  loadUserCalculators: async () => {
    try {
      set({ loadingCalculators: true });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, clearing calculators');
        set({ savedCalculators: [], loadingCalculators: false });
        return;
      }

      console.log('Loading calculators for user:', user.id);

      const { data, error } = await supabase
        .from('calculators')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading calculators:', error);
        throw error;
      }

      console.log('Loaded calculators:', data);
      set({ savedCalculators: data || [], loadingCalculators: false });
    } catch (error) {
      console.error('Error loading calculators:', error);
      toast({
        title: "Error loading calculators",
        description: `Failed to load your calculators: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      set({ loadingCalculators: false });
    }
  },

  likeCalculator: async (calculatorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to like calculators.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('calculator_likes')
        .insert({
          calculator_id: calculatorId,
          user_id: user.id,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already liked",
            description: "You've already liked this calculator.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Calculator liked!",
          description: "Thanks for your feedback.",
        });
      }

      // Reload calculators to update like count
      get().loadUserCalculators();
    } catch (error) {
      console.error('Error liking calculator:', error);
      toast({
        title: "Like failed",
        description: "Failed to like calculator. Please try again.",
        variant: "destructive",
      });
    }
  },

  unlikeCalculator: async (calculatorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('calculator_likes')
        .delete()
        .eq('calculator_id', calculatorId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Like removed",
        description: "Calculator unliked successfully.",
      });

      // Reload calculators to update like count
      get().loadUserCalculators();
    } catch (error) {
      console.error('Error unliking calculator:', error);
      toast({
        title: "Unlike failed",
        description: "Failed to unlike calculator. Please try again.",
        variant: "destructive",
      });
    }
  },

  incrementViews: async (calculatorId: string) => {
    try {
      const { error } = await supabase.rpc('increment_calculator_views', {
        calc_id: calculatorId
      });

      if (error) {
        console.error('Error incrementing views:', error);
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  },

  deleteCalculator: async (calculatorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to delete calculators.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('calculators')
        .delete()
        .eq('id', calculatorId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Calculator deleted!",
        description: "Your calculator has been deleted successfully.",
      });

      // Reload user calculators
      get().loadUserCalculators();
    } catch (error) {
      console.error('Error deleting calculator:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete calculator. Please try again.",
        variant: "destructive",
      });
    }
  },
}));
