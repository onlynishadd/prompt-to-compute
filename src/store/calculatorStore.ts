import { create } from "zustand";
import { aiService } from "@/services/aiService";

interface CalculatorState {
  prompt: string;
  generating: boolean;
  spec: string | null;
  setPrompt: (v: string) => void;
  generate: () => Promise<void>;
  reset: () => void;
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  prompt: "",
  generating: false,
  spec: null,
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
      
      const generatedSpec = await aiService.generateCalculator(prompt);
      set({ spec: JSON.stringify(generatedSpec, null, 2) });
    } catch (error) {
      console.error("Error generating calculator:", error);
    } finally {
      set({ generating: false });
    }
  },
}));
