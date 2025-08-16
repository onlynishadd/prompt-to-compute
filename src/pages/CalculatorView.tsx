import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, Heart, Eye, ArrowLeft, Copy, Share2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

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

interface CalculatorData {
  id: string;
  title: string;
  prompt: string;
  spec: CalculatorSpec;
  is_public: boolean;
  likes_count: number;
  views_count: number;
  created_at: string;
  user_id: string;
  users?: {
    full_name?: string;
    email: string;
  };
}

export default function CalculatorView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [calculator, setCalculator] = useState<CalculatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      loadCalculator();
      checkIfLiked();
    }
  }, [id, user]);

  const loadCalculator = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('calculators')
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading calculator:', error);
        toast({
          title: "Calculator not found",
          description: "The calculator you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setCalculator(data);
      
      // Initialize field values
      if (data.spec && data.spec.fields) {
        const initialValues: Record<string, any> = {};
        data.spec.fields.forEach((field: CalculatorField) => {
          initialValues[field.id] = '';
        });
        setFieldValues(initialValues);
      }

      // Increment view count
      await supabase.rpc('increment_calculator_views', {
        calc_id: id
      });

    } catch (error) {
      console.error('Error loading calculator:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !id) return;

    try {
      const { data } = await supabase
        .from('calculator_likes')
        .select('id')
        .eq('calculator_id', id)
        .eq('user_id', user.id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      setIsLiked(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like calculators.",
        variant: "destructive",
      });
      return;
    }

    if (!id) return;

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('calculator_likes')
          .delete()
          .eq('calculator_id', id)
          .eq('user_id', user.id);
        
        setIsLiked(false);
        setCalculator(prev => prev ? { ...prev, likes_count: prev.likes_count - 1 } : null);
        
        toast({
          title: "Like removed",
          description: "Calculator unliked successfully.",
        });
      } else {
        // Like
        await supabase
          .from('calculator_likes')
          .insert({
            calculator_id: id,
            user_id: user.id,
          });
        
        setIsLiked(true);
        setCalculator(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null);
        
        toast({
          title: "Calculator liked!",
          description: "Thanks for your feedback.",
        });
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleCalculate = () => {
    if (!calculator) return;

    try {
      const calculatorSpec = calculator.spec;
      
      // Create a safe evaluation context
      const context = { ...fieldValues };
      
      // Convert string values to numbers where appropriate
      calculatorSpec.fields.forEach((field: CalculatorField) => {
        if (field.type === 'number' && context[field.id]) {
          context[field.id] = parseFloat(context[field.id]) || 0;
        }
      });

      // Perform calculation based on the calculator type
      let calculationResult: string;
      const title = calculatorSpec.title?.toLowerCase() || '';

      if (title.includes('loan') || title.includes('payment')) {
        const amount = context.amount || 0;
        const rate = (context.rate || 0) / 100 / 12;
        const term = (context.term || 0) * 12;
        
        if (amount && rate && term) {
          const payment = (amount * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
          calculationResult = `Monthly Payment: $${payment.toFixed(2)}`;
        } else {
          calculationResult = "Please enter valid values";
        }
      } else if (title.includes('bmi') || title.includes('body mass')) {
        const weight = context.weight || 0;
        const height = context.height || 0;
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
        const bill = context.bill_amount || 0;
        const tipPercent = context.tip_percentage || 0;
        const tipAmount = bill * (tipPercent / 100);
        const total = bill + tipAmount;
        calculationResult = `Tip: $${tipAmount.toFixed(2)}, Total: $${total.toFixed(2)}`;
      } else if (title.includes('roi')) {
        const investment = context.investment || 0;
        const returnValue = context.return_value || 0;
        if (investment) {
          const roi = ((returnValue - investment) / investment) * 100;
          calculationResult = `ROI: ${roi.toFixed(2)}%`;
        } else {
          calculationResult = "Please enter valid investment amount";
        }
      } else {
        // Generic calculation for custom calculators
        const values = Object.values(context).filter(v => typeof v === 'number');
        const sum = values.reduce((a: number, b: number) => a + b, 0);
        calculationResult = `Result: ${sum.toFixed(2)}`;
      }

      setResult(calculationResult);
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Calculator link copied to clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading calculator...</span>
      </div>
    );
  }

  if (!calculator) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Calculator not found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Gallery
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{calculator.title}</h1>
            <p className="text-muted-foreground mb-4">{calculator.prompt}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>by {calculator.users?.full_name || calculator.users?.email?.split('@')[0] || 'Anonymous'}</span>
              <span>•</span>
              <span>{formatDate(calculator.created_at)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm">{calculator.views_count || 0} views</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
            <span className="text-sm">{calculator.likes_count || 0} likes</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={isLiked ? 'text-red-500' : ''}
          >
            {isLiked ? 'Liked' : 'Like'}
          </Button>
        </div>
      </div>

      {/* Calculator */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {calculator.spec.title}
          </CardTitle>
          {calculator.spec.description && (
            <p className="text-muted-foreground">{calculator.spec.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {calculator.spec.fields.map((field: CalculatorField) => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                {renderField(field)}
              </div>
            ))}
          </div>
          
          <Button 
            onClick={handleCalculate}
            className="w-fit"
          >
            {calculator.spec.cta || "Calculate"}
          </Button>
          
          {result && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Result:</h4>
              <p className="text-lg font-semibold text-primary">{result}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
