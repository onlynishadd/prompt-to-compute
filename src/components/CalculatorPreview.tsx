import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalculatorStore } from "@/store/calculatorStore";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CalculatorField {
  id: string;
  label: string;
  type: 'number' | 'text' | 'select';
  placeholder?: string;
  options?: string[];
}

interface CalculatorSpec {
  title: string;
  fields: CalculatorField[];
  formula: string;
  cta: string;
  description?: string;
}

export default function CalculatorPreview() {
  const { spec, generating, saveCalculator, savedCalculators, loadUserCalculators, loadingCalculators } = useCalculatorStore();
  const { user } = useAuth();
  const [showSpec, setShowSpec] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserCalculators();
    }
  }, [user, loadUserCalculators]);

  useEffect(() => {
    // Reset field values when spec changes
    if (spec) {
      try {
        const calculatorSpec: CalculatorSpec = JSON.parse(spec);
        const initialValues: Record<string, any> = {};
        calculatorSpec.fields.forEach(field => {
          initialValues[field.id] = '';
        });
        setFieldValues(initialValues);
        setResult(null);
      } catch (error) {
        console.error('Error parsing calculator spec:', error);
      }
    }
  }, [spec]);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setSaving(true);
    await saveCalculator(title, isPublic);
    setSaving(false);
    setSaveDialogOpen(false);
    setTitle('');
    setIsPublic(false);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleCalculate = () => {
    if (!spec) return;

    try {
      const calculatorSpec: CalculatorSpec = JSON.parse(spec);
      
      // Create a safe evaluation context
      const context = { ...fieldValues };
      
      // Convert string values to numbers where appropriate
      calculatorSpec.fields.forEach(field => {
        if (field.type === 'number' && context[field.id]) {
          context[field.id] = parseFloat(context[field.id]) || 0;
        }
      });

      // For now, we'll use a simple approach - in production you'd want more sophisticated formula evaluation
      let calculatedResult = 'Calculation completed';
      
      // You could implement a more sophisticated formula evaluator here
      // For now, we'll just show that calculation was attempted
      if (calculatorSpec.formula) {
        calculatedResult = `Formula: ${calculatorSpec.formula}`;
      }

      setResult(calculatedResult);
    } catch (error) {
      console.error('Error calculating result:', error);
      setResult('Error in calculation');
    }
  };

  const renderField = (field: CalculatorField) => {
    const value = fieldValues[field.id] || '';

    switch (field.type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
      
      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
    }
  };

  const renderCalculator = () => {
    if (!spec) return null;

    try {
      const calculatorSpec: CalculatorSpec = JSON.parse(spec);
      
      return (
        <div className="grid gap-4">
          {calculatorSpec.description && (
            <p className="text-sm text-muted-foreground">{calculatorSpec.description}</p>
          )}
          
          <div className="grid md:grid-cols-3 gap-3">
            {calculatorSpec.fields.map((field) => (
              <div key={field.id} className="grid gap-1">
                <label className="text-sm font-medium">{field.label}</label>
                {renderField(field)}
              </div>
            ))}
          </div>
          
          <Button 
            className="w-fit" 
            variant="default"
            onClick={handleCalculate}
            disabled={generating}
          >
            {calculatorSpec.cta || "Calculate"}
          </Button>
          
          {result && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Result:</h4>
              <p className="text-sm">{result}</p>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error rendering calculator:', error);
      return <p className="text-red-500">Error rendering calculator</p>;
    }
  };

  return (
    <section aria-label="Calculator preview">
      <Card className="shadow-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="text-primary" />
              <CardTitle>Live Preview</CardTitle>
            </div>
            {spec && user && (
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Save Calculator
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Calculator</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Calculator Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter calculator title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="public"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                      />
                      <Label htmlFor="public">Make calculator public</Label>
                    </div>
                    <Button 
                      onClick={handleSave} 
                      disabled={!title.trim() || saving}
                      className="w-full"
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Calculator
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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

          {!generating && spec && renderCalculator()}
          
          {spec && (
            <div className="mt-6 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSpec(!showSpec)}
                className="w-fit"
              >
                {showSpec ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showSpec ? 'Hide' : 'Show'} JSON Spec
              </Button>
              {showSpec && (
                <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto">
                  {spec}
                </pre>
              )}
            </div>
          )}

          {/* Saved Calculators Section */}
          {user && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold mb-4">Your Calculators</h3>
              {loadingCalculators ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : savedCalculators.length > 0 ? (
                <div className="grid gap-3">
                  {savedCalculators.map((calc) => (
                    <div key={calc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{calc.title}</h4>
                        <p className="text-sm text-muted-foreground">{calc.prompt}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {calc.is_public && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Public
                          </span>
                        )}
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No calculators saved yet. Generate and save your first calculator!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
