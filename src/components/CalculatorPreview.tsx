import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalculatorStore } from "@/store/calculatorStore";
import { useAuth } from "@/contexts/AuthContext";
import { SaveCalculatorDialog } from "@/components/calculator/SaveCalculatorDialog";
import { ShareCalculatorDialog } from "@/components/ShareCalculatorDialog";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Save, Share2, Download } from "lucide-react";

export default function CalculatorPreview() {
  const { spec, generating, prompt } = useCalculatorStore();
  const { user } = useAuth();
  const [inputs, setInputs] = useState<{[key: string]: string}>({});
  const [result, setResult] = useState<string | null>(null);

  const handleInputChange = (fieldId: string, value: string) => {
    setInputs(prev => ({ ...prev, [fieldId]: value }));
  };

  const calculateResult = () => {
    try {
      if (!spec) return;
      const parsedSpec = JSON.parse(spec);
      
      // Check if all required fields have values
      const missingFields = parsedSpec.fields.filter((field: any) => 
        !inputs[field.id] || inputs[field.id].trim() === ''
      );
      
      if (missingFields.length > 0) {
        setResult(`Please fill in: ${missingFields.map((f: any) => f.label).join(', ')}`);
        return;
      }

      // Convert inputs to numbers where needed
      const numericInputs: {[key: string]: number} = {};
      for (const field of parsedSpec.fields) {
        const value = inputs[field.id];
        if (field.type === 'number') {
          const num = parseFloat(value);
          if (isNaN(num)) {
            setResult(`Invalid number for ${field.label}`);
            return;
          }
          numericInputs[field.id] = num;
        }
      }

      // Perform calculation based on the calculator type
      let calculationResult: string;
      const title = parsedSpec.title?.toLowerCase() || '';

      if (title.includes('loan') || title.includes('payment')) {
        const amount = numericInputs.amount || 0;
        const rate = (numericInputs.rate || 0) / 100 / 12;
        const term = (numericInputs.term || 0) * 12;
        
        if (amount && rate && term) {
          const payment = (amount * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
          calculationResult = `Monthly Payment: $${payment.toFixed(2)}`;
        } else {
          calculationResult = "Please enter valid values";
        }
      } else if (title.includes('bmi') || title.includes('body mass')) {
        const weight = numericInputs.weight || 0;
        const height = numericInputs.height || 0;
        if (weight && height) {
          const bmi = weight / Math.pow(height / 100, 2);
          let category = "";
          if (bmi < 18.5) category = " (Underweight)";
          else if (bmi < 25) category = " (Normal)";
          else if (bmi < 30) category = " (Overweight)";
          else category = " (Obese)";
          calculationResult = `BMI: ${bmi.toFixed(1)}${category}`;
        } else {
          calculationResult = "Please enter valid weight and height";
        }
      } else if (title.includes('tip')) {
        const bill = numericInputs.bill_amount || 0;
        const tipPercent = numericInputs.tip_percentage || 0;
        const tipAmount = bill * (tipPercent / 100);
        const total = bill + tipAmount;
        calculationResult = `Tip: $${tipAmount.toFixed(2)}, Total: $${total.toFixed(2)}`;
      } else if (title.includes('roi')) {
        const investment = numericInputs.investment || 0;
        const returnValue = numericInputs.return_value || 0;
        if (investment) {
          const roi = ((returnValue - investment) / investment) * 100;
          calculationResult = `ROI: ${roi.toFixed(2)}%`;
        } else {
          calculationResult = "Please enter valid investment amount";
        }
      } else if (title.includes('calorie') || title.includes('bmr')) {
        const weight = numericInputs.weight || 0;
        const height = numericInputs.height || 0;
        const age = numericInputs.age || 0;
        
        if (weight && height && age) {
          // Using Mifflin-St Jeor Equation for males (simplified)
          const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
          const tdee = bmr * 1.2; // Sedentary
          calculationResult = `BMR: ${bmr.toFixed(0)} cal/day, TDEE: ${tdee.toFixed(0)} cal/day`;
        } else {
          calculationResult = "Please enter valid values";
        }
      } else {
        // Generic calculation for custom calculators
        const values = Object.values(numericInputs);
        const sum = values.reduce((a, b) => a + b, 0);
        calculationResult = `Result: ${sum.toFixed(2)}`;
      }
      
      setResult(calculationResult);
    } catch (error) {
      console.error('Calculation error:', error);
      setResult('Error in calculation');
    }
  };

  let parsedSpec = null;
  try {
    parsedSpec = spec ? JSON.parse(spec) : null;
  } catch (error) {
    console.error('Error parsing spec:', error);
  }

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

          {!generating && parsedSpec && (
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">{parsedSpec.title}</h3>
              
              <div className="grid gap-3">
                {parsedSpec.fields?.map((field: any) => (
                  <div key={field.id} className="grid gap-1">
                    <label className="text-sm font-medium">{field.label}</label>
                    <Input 
                      type={field.type}
                      placeholder={field.placeholder}
                      value={inputs[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              
              <Button onClick={calculateResult} className="w-fit" variant="default">
                {parsedSpec.cta || 'Calculate'}
              </Button>
              
              {result && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Result:</h4>
                    <p className="text-lg font-bold text-primary">{result}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t">
                {user ? (
                  <SaveCalculatorDialog 
                    prompt={prompt} 
                    spec={spec}
                    onSaved={() => {}}
                  >
                    <Button variant="outline" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Calculator
                    </Button>
                  </SaveCalculatorDialog>
                ) : (
                  <LoginDialog>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Calculator
                    </Button>
                  </LoginDialog>
                )}
                
                <Button variant="outline" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
              
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
