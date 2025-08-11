import { create } from "zustand";

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
    set({ generating: true });

    // Simulate AI generation for MVP UI only
    await new Promise((r) => setTimeout(r, 900));

    const sampleSpec = {
      title: "Loan Payment Calculator",
      fields: [
        { id: "amount", label: "Amount", type: "number", placeholder: "20000" },
        { id: "rate", label: "APR %", type: "number", placeholder: "6.5" },
        { id: "term", label: "Years", type: "number", placeholder: "5" },
      ],
      formula: "PMT((rate/100)/12, term*12, -amount)",
      cta: "Calculate Payment",
    };

    set({ spec: JSON.stringify(sampleSpec, null, 2), generating: false });
  },
}));
