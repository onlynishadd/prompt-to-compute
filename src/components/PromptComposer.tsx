import { useCalculatorStore } from "@/store/calculatorStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const examplePrompts = [
  "Mortgage affordability",
  "Startup runway calculator",
  "BMR & calorie target",
  "ROI of ad spend",
];

export default function PromptComposer() {
  const { prompt, setPrompt, generate, generating } = useCalculatorStore();
  const [local, setLocal] = useState(prompt);

  const onGenerate = async () => {
    setPrompt(local);
    toast({ title: "Generating calculator", description: "Turning your idea into an interactive tool…" });
    await generate();
    toast({ title: "Draft ready", description: "Preview your generated calculator below." });
  };

  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 aurora-sheen animate-aurora opacity-30" aria-hidden />
      <Card className="shadow-elevated border-muted/50">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              <p className="text-sm text-muted-foreground">Describe what you want to calculate</p>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="e.g. Calculate carbon footprint for a roadtrip…"
              />
              <Button variant="hero" size="lg" onClick={onGenerate} disabled={generating}>
                <Wand2 /> {generating ? "Generating…" : "Generate Calculator"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setLocal(p)}
                  className="text-xs px-3 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
