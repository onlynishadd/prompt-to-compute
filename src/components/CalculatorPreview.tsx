import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalculatorStore } from "@/store/calculatorStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

export default function CalculatorPreview() {
  const { spec, generating } = useCalculatorStore();

  return (
    <section aria-label="Calculator preview">
      <Card className="shadow-elevated">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="text-primary" />
            <CardTitle>Live Preview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {generating && (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 w-1/3 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
              <div className="h-10 w-1/2 bg-muted rounded" />
            </div>
          )}

          {!generating && !spec && (
            <p className="text-muted-foreground">Your generated calculator will appear here.</p>
          )}

          {!generating && spec && (
            <div className="grid gap-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="grid gap-1">
                  <label className="text-sm">Amount</label>
                  <Input placeholder="20000" />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">APR %</label>
                  <Input placeholder="6.5" />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Years</label>
                  <Input placeholder="5" />
                </div>
              </div>
              <Button className="w-fit" variant="default">Calculate Payment</Button>
              <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto">
                {spec}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
