interface CalculatorSpec {
  title: string;
  fields: Array<{
    id: string;
    label: string;
    type: string;
    placeholder: string;
  }>;
  formula?: string;
  cta: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIService {
  private geminiKey: string;
  private geminiUrl: string;

  constructor() {
    this.geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  async generateCalculator(prompt: string): Promise<CalculatorSpec> {
    try {
      const systemPrompt = `You are a calculator specification generator. Given a user's description, create a JSON specification for an interactive calculator.

IMPORTANT: Always respond with ONLY valid JSON, no explanations, no markdown formatting.

The JSON should have this exact structure:
{
  "title": "Calculator Name",
  "fields": [
    {
      "id": "field_name",
      "label": "Field Label", 
      "type": "number",
      "placeholder": "Example value"
    }
  ],
  "formula": "mathematical formula using field ids",
  "cta": "Calculate Button Text"
}

Rules:
1. Use descriptive field IDs (lowercase, underscores)
2. Field types: "number" (default), "text", or "select"
3. Include 2-4 relevant fields
4. Always include a formula using JavaScript math expressions
5. Make titles and CTAs specific to the calculation type
6. Use realistic placeholder values

Examples:
- "tax calculator" → {"title":"Tax Calculator","fields":[{"id":"amount","label":"Amount","type":"number","placeholder":"1000"},{"id":"tax_rate","label":"Tax Rate (%)","type":"number","placeholder":"15"}],"formula":"amount * (tax_rate / 100)","cta":"Calculate Tax"}
- "BMI calculator" → {"title":"BMI Calculator","fields":[{"id":"weight","label":"Weight (kg)","type":"number","placeholder":"70"},{"id":"height","label":"Height (cm)","type":"number","placeholder":"175"}],"formula":"weight / ((height/100) * (height/100))","cta":"Calculate BMI"}
- "tip calculator" → {"title":"Tip Calculator","fields":[{"id":"bill_amount","label":"Bill Amount","type":"number","placeholder":"50.00"},{"id":"tip_percentage","label":"Tip (%)","type":"number","placeholder":"18"}],"formula":"bill_amount * (tip_percentage / 100)","cta":"Calculate Tip"}`;

      // If no API key is provided, fall back to the predefined calculators
      if (!this.geminiKey) {
        console.log('No Gemini API key provided, using fallback calculator');
        return this.getFallbackCalculator(prompt);
      }

      const response = await fetch(`${this.geminiUrl}?key=${this.geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nGenerate a calculator specification for: ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No response content from AI model');
      }

      // Extract JSON from the response (handle potential markdown formatting)
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\s*/, '').replace(/\s*```$/, '');
      }

      try {
        const spec = JSON.parse(jsonContent);
        return this.validateAndSanitizeSpec(spec);
      } catch (parseError) {
        console.error('Failed to parse AI response:', jsonContent);
        throw new Error('Invalid JSON response from AI model');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback to a default calculator spec if AI fails
      return this.getFallbackCalculator(prompt);
    }
  }

  private validateAndSanitizeSpec(spec: any): CalculatorSpec {
    // Ensure required fields exist
    if (!spec.title || !Array.isArray(spec.fields)) {
      throw new Error('Invalid calculator specification structure');
    }

    // Sanitize and validate fields
    const validatedFields = spec.fields.map((field: any, index: number) => ({
      id: field.id || `field_${index}`,
      label: field.label || `Field ${index + 1}`,
      type: ['number', 'text', 'select'].includes(field.type) ? field.type : 'number',
      placeholder: field.placeholder || ''
    }));

    return {
      title: spec.title,
      fields: validatedFields,
      formula: spec.formula || undefined,
      cta: spec.cta || 'Calculate'
    };
  }

  private getFallbackCalculator(prompt: string): CalculatorSpec {
    // Provide intelligent fallbacks based on keywords in the prompt
    const lowerPrompt = prompt.toLowerCase();

    // Tax related calculators
    if (lowerPrompt.includes('tax') || lowerPrompt.includes('vat') || lowerPrompt.includes('gst')) {
      return {
        title: 'Tax Calculator',
        fields: [
          { id: 'amount', label: 'Amount', type: 'number', placeholder: '1000' },
          { id: 'tax_rate', label: 'Tax Rate (%)', type: 'number', placeholder: '15' }
        ],
        formula: 'amount * (tax_rate / 100)',
        cta: 'Calculate Tax'
      };
    }
    // Percentage calculators
    else if (lowerPrompt.includes('percentage') || lowerPrompt.includes('percent') || lowerPrompt.includes('%')) {
      return {
        title: 'Percentage Calculator',
        fields: [
          { id: 'value', label: 'Value', type: 'number', placeholder: '250' },
          { id: 'percentage', label: 'Percentage (%)', type: 'number', placeholder: '20' }
        ],
        formula: 'value * (percentage / 100)',
        cta: 'Calculate Percentage'
      };
    }
    // Discount calculators
    else if (lowerPrompt.includes('discount') || lowerPrompt.includes('sale')) {
      return {
        title: 'Discount Calculator',
        fields: [
          { id: 'original_price', label: 'Original Price', type: 'number', placeholder: '100' },
          { id: 'discount_rate', label: 'Discount (%)', type: 'number', placeholder: '25' }
        ],
        formula: 'original_price - (original_price * (discount_rate / 100))',
        cta: 'Calculate Final Price'
      };
    }
    // Loan and mortgage calculators
    else if (lowerPrompt.includes('loan') || lowerPrompt.includes('payment') || lowerPrompt.includes('mortgage')) {
      return {
        title: 'Loan Payment Calculator',
        fields: [
          { id: 'amount', label: 'Loan Amount', type: 'number', placeholder: '20000' },
          { id: 'rate', label: 'Interest Rate (%)', type: 'number', placeholder: '6.5' },
          { id: 'term', label: 'Term (years)', type: 'number', placeholder: '5' }
        ],
        formula: 'PMT(rate/100/12, term*12, -amount)',
        cta: 'Calculate Payment'
      };
    }
    // BMI calculators
    else if (lowerPrompt.includes('bmi') || lowerPrompt.includes('body mass')) {
      return {
        title: 'BMI Calculator',
        fields: [
          { id: 'weight', label: 'Weight (kg)', type: 'number', placeholder: '70' },
          { id: 'height', label: 'Height (cm)', type: 'number', placeholder: '175' }
        ],
        formula: 'weight / ((height/100) * (height/100))',
        cta: 'Calculate BMI'
      };
    }
    // Tip calculators
    else if (lowerPrompt.includes('tip')) {
      return {
        title: 'Tip Calculator',
        fields: [
          { id: 'bill_amount', label: 'Bill Amount', type: 'number', placeholder: '50.00' },
          { id: 'tip_percentage', label: 'Tip Percentage', type: 'number', placeholder: '18' }
        ],
        formula: 'bill_amount * (tip_percentage / 100)',
        cta: 'Calculate Tip'
      };
    }
    // Investment and ROI calculators
    else if (lowerPrompt.includes('roi') || lowerPrompt.includes('return') || lowerPrompt.includes('investment')) {
      return {
        title: 'ROI Calculator',
        fields: [
          { id: 'investment', label: 'Initial Investment', type: 'number', placeholder: '10000' },
          { id: 'return_value', label: 'Final Value', type: 'number', placeholder: '12000' }
        ],
        formula: '((return_value - investment) / investment) * 100',
        cta: 'Calculate ROI'
      };
    }
    // Calorie calculators
    else if (lowerPrompt.includes('calorie') || lowerPrompt.includes('bmr')) {
      return {
        title: 'Calorie Calculator',
        fields: [
          { id: 'weight', label: 'Weight (kg)', type: 'number', placeholder: '70' },
          { id: 'height', label: 'Height (cm)', type: 'number', placeholder: '175' },
          { id: 'age', label: 'Age', type: 'number', placeholder: '30' }
        ],
        cta: 'Calculate Calories'
      };
    }
    // Interest calculators
    else if (lowerPrompt.includes('interest') || lowerPrompt.includes('compound')) {
      return {
        title: 'Interest Calculator',
        fields: [
          { id: 'principal', label: 'Principal Amount', type: 'number', placeholder: '5000' },
          { id: 'rate', label: 'Interest Rate (%)', type: 'number', placeholder: '8' },
          { id: 'time', label: 'Time (years)', type: 'number', placeholder: '3' }
        ],
        formula: 'principal * (1 + (rate/100)) ** time',
        cta: 'Calculate Interest'
      };
    }
    // Area calculators
    else if (lowerPrompt.includes('area') || lowerPrompt.includes('rectangle') || lowerPrompt.includes('circle')) {
      if (lowerPrompt.includes('circle')) {
        return {
          title: 'Circle Area Calculator',
          fields: [
            { id: 'radius', label: 'Radius', type: 'number', placeholder: '5' }
          ],
          formula: 'Math.PI * radius * radius',
          cta: 'Calculate Area'
        };
      } else {
        return {
          title: 'Rectangle Area Calculator',
          fields: [
            { id: 'length', label: 'Length', type: 'number', placeholder: '10' },
            { id: 'width', label: 'Width', type: 'number', placeholder: '8' }
          ],
          formula: 'length * width',
          cta: 'Calculate Area'
        };
      }
    }
    // Grade calculators
    else if (lowerPrompt.includes('grade') || lowerPrompt.includes('gpa')) {
      return {
        title: 'Grade Calculator',
        fields: [
          { id: 'total_points', label: 'Total Points Earned', type: 'number', placeholder: '85' },
          { id: 'max_points', label: 'Maximum Points', type: 'number', placeholder: '100' }
        ],
        formula: '(total_points / max_points) * 100',
        cta: 'Calculate Grade'
      };
    }
    // Currency conversion (simplified)
    else if (lowerPrompt.includes('currency') || lowerPrompt.includes('exchange')) {
      return {
        title: 'Currency Converter',
        fields: [
          { id: 'amount', label: 'Amount', type: 'number', placeholder: '100' },
          { id: 'rate', label: 'Exchange Rate', type: 'number', placeholder: '1.2' }
        ],
        formula: 'amount * rate',
        cta: 'Convert Currency'
      };
    }
    // Fuel efficiency
    else if (lowerPrompt.includes('fuel') || lowerPrompt.includes('mpg') || lowerPrompt.includes('mileage')) {
      return {
        title: 'Fuel Efficiency Calculator',
        fields: [
          { id: 'distance', label: 'Distance (miles)', type: 'number', placeholder: '300' },
          { id: 'fuel_used', label: 'Fuel Used (gallons)', type: 'number', placeholder: '12' }
        ],
        formula: 'distance / fuel_used',
        cta: 'Calculate MPG'
      };
    }
    // Default fallback - make it more useful
    else {
      return {
        title: 'Simple Calculator',
        fields: [
          { id: 'number1', label: 'First Number', type: 'number', placeholder: '10' },
          { id: 'number2', label: 'Second Number', type: 'number', placeholder: '5' }
        ],
        formula: 'number1 + number2',
        cta: 'Calculate Sum'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.geminiKey) {
        return false; // No API key available
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.geminiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Gemini API connection test failed:', error);
      return false;
    }
  }
}

export const aiService = new AIService();
