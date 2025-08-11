import PromptComposer from "@/components/PromptComposer";
import CalculatorPreview from "@/components/CalculatorPreview";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="container py-10">
        <p className="text-sm text-muted-foreground">Everything Calculator</p>
        <h1 className="mt-2 text-4xl md:text-6xl font-semibold tracking-tight">
          Everything Calculator Platform
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          Generate, share, and embed calculators from a simple prompt. Build interactive tools in seconds.
        </p>
      </header>
      <main className="container pb-16 grid gap-8">
        <PromptComposer />
        <CalculatorPreview />
      </main>
      <footer className="container py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Everything Calculator — Built for creators.
      </footer>
    </div>
  );
};

export default Index;
