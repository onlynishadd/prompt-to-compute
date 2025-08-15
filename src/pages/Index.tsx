import PromptComposer from "@/components/PromptComposer";
import CalculatorPreview from "@/components/CalculatorPreview";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-16 grid gap-8">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Everything Calculator</p>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
            Everything Calculator Platform
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate, share, and embed calculators from a simple prompt. Build interactive tools in seconds.
          </p>
        </div>
        <PromptComposer />
        <CalculatorPreview />
      </main>
    </div>
  );
};

export default Index;
