import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { calculatorService, Calculator } from '@/services/calculatorService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { ShareCalculatorDialog } from '@/components/ShareCalculatorDialog'
import { DeleteCalculatorDialog } from '@/components/DeleteCalculatorDialog'
import { 
  ArrowLeft, 
  Heart, 
  GitFork, 
  Eye, 
  Share2, 
  Download, 
  Edit, 
  Trash2,
  Calculator as CalculatorIcon,
  User,
  Calendar,
  Tag,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const CalculatorView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [calculator, setCalculator] = useState<Calculator | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiking, setIsLiking] = useState(false)
  const [isForking, setIsForking] = useState(false)
  const [calculatorInputs, setCalculatorInputs] = useState<{[key: string]: string}>({})
  const [calculatorResult, setCalculatorResult] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadCalculator()
    }
  }, [id])

  const loadCalculator = async () => {
    if (!id) return
    
    setLoading(true)
    try {
      const { data, error } = await calculatorService.getCalculator(id)
      if (error) {
        toast({
          title: "Error loading calculator",
          description: error.message,
          variant: "destructive",
        })
        navigate('/')
        return
      }
      setCalculator(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load calculator",
        variant: "destructive",
      })
      navigate('/')
    }
    setLoading(false)
  }

  const handleLike = async () => {
    if (!calculator || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like calculators",
        variant: "destructive",
      })
      return
    }

    setIsLiking(true)
    try {
      if (calculator.is_liked) {
        const { error } = await calculatorService.unlikeCalculator(calculator.id)
        if (!error) {
          setCalculator({
            ...calculator,
            is_liked: false,
            likes_count: calculator.likes_count - 1
          })
        }
      } else {
        const { error } = await calculatorService.likeCalculator(calculator.id)
        if (!error) {
          setCalculator({
            ...calculator,
            is_liked: true,
            likes_count: calculator.likes_count + 1
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      })
    }
    setIsLiking(false)
  }

  const handleFork = async () => {
    if (!calculator || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to fork calculators",
        variant: "destructive",
      })
      return
    }

    setIsForking(true)
    try {
      const { data: forkedCalculator, error } = await calculatorService.forkCalculator(calculator.id)
      if (error) {
        toast({
          title: "Fork failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Calculator forked!",
          description: `"${calculator.title}" has been forked to your collection.`,
        })
        navigate(`/calculator/${forkedCalculator!.id}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fork calculator",
        variant: "destructive",
      })
    }
    setIsForking(false)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Calculator link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleDelete = (calculatorId: string) => {
    toast({
      title: "Calculator deleted",
      description: "Redirecting to home page...",
    })
    navigate('/')
  }

  const handleInputChange = (fieldId: string, value: string) => {
    setCalculatorInputs(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleCalculate = () => {
    try {
      const spec = calculator?.spec
      if (!spec || !spec.fields) {
        setCalculatorResult("Invalid calculator specification")
        return
      }

      // Check if all required fields have values
      const missingFields = spec.fields.filter((field: any) => 
        !calculatorInputs[field.id] || calculatorInputs[field.id].trim() === ''
      )
      
      if (missingFields.length > 0) {
        setCalculatorResult(`Please fill in all fields: ${missingFields.map((f: any) => f.label).join(', ')}`)
        return
      }

      // Convert inputs to numbers where needed
      const inputs: {[key: string]: number} = {}
      for (const field of spec.fields) {
        const value = calculatorInputs[field.id]
        if (field.type === 'number') {
          const num = parseFloat(value)
          if (isNaN(num)) {
            setCalculatorResult(`Invalid number for ${field.label}`)
            return
          }
          inputs[field.id] = num
        } else {
          inputs[field.id] = value
        }
      }

      // Execute calculator-specific logic based on title or formula
      let result: string

      if (spec.title === "Loan Payment Calculator" || spec.formula?.includes("PMT")) {
        // Loan payment calculation
        const amount = inputs.amount || 0
        const rate = (inputs.rate || 0) / 100 / 12  // Convert annual percentage to monthly decimal
        const term = (inputs.term || 0) * 12  // Convert years to months
        
        if (amount && rate && term) {
          const payment = (amount * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)
          result = `$${payment.toFixed(2)} per month`
        } else {
          result = "Please check your input values"
        }
      } else if (spec.title?.toLowerCase().includes("bmi") || spec.title?.toLowerCase().includes("body mass")) {
        // BMI calculation
        const weight = inputs.weight || 0
        const height = inputs.height || 0
        if (weight && height) {
          const bmi = weight / Math.pow(height / 100, 2)  // Assuming height in cm, weight in kg
          let category = ""
          if (bmi < 18.5) category = " (Underweight)"
          else if (bmi < 25) category = " (Normal weight)"
          else if (bmi < 30) category = " (Overweight)"
          else category = " (Obese)"
          result = `BMI: ${bmi.toFixed(1)}${category}`
        } else {
          result = "Please enter valid weight and height"
        }
      } else if (spec.title?.toLowerCase().includes("roi") || spec.title?.toLowerCase().includes("return")) {
        // ROI calculation
        const investment = inputs.investment || inputs.cost || 0
        const return_value = inputs.return || inputs.revenue || inputs.profit || 0
        if (investment) {
          const roi = ((return_value - investment) / investment) * 100
          result = `ROI: ${roi.toFixed(2)}%`
        } else {
          result = "Please enter valid investment and return values"
        }
      } else if (spec.title?.toLowerCase().includes("mortgage") || spec.title?.toLowerCase().includes("affordability")) {
        // Mortgage affordability
        const income = inputs.income || 0
        const expenses = inputs.expenses || inputs.debt || 0
        const downPayment = inputs.downPayment || inputs.down_payment || 0
        const rate = (inputs.rate || inputs.interest_rate || 3.5) / 100 / 12
        const term = (inputs.term || inputs.years || 30) * 12
        
        const maxPayment = (income - expenses) * 0.28 / 12  // 28% debt-to-income ratio
        const maxLoan = maxPayment * (Math.pow(1 + rate, term) - 1) / (rate * Math.pow(1 + rate, term))
        const maxPrice = maxLoan + downPayment
        
        result = `Max affordable home price: $${maxPrice.toFixed(0)}`
      } else if (spec.title?.toLowerCase().includes("calorie") || spec.title?.toLowerCase().includes("bmr")) {
        // BMR and calorie calculation
        const weight = inputs.weight || 0
        const height = inputs.height || 0
        const age = inputs.age || 0
        const gender = inputs.gender || "male"
        
        if (weight && height && age) {
          // Mifflin-St Jeor Equation
          let bmr: number
          if (gender.toLowerCase() === "female") {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
          } else {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
          }
          
          const activityMultiplier = inputs.activity_level || 1.2  // Sedentary default
          const tdee = bmr * activityMultiplier
          
          result = `BMR: ${bmr.toFixed(0)} cal/day, TDEE: ${tdee.toFixed(0)} cal/day`
        } else {
          result = "Please enter valid weight, height, and age"
        }
      } else {
        // Generic calculation - try to evaluate simple formulas
        if (spec.formula) {
          try {
            // Replace field names in formula with actual values
            let formula = spec.formula
            for (const [key, value] of Object.entries(inputs)) {
              formula = formula.replace(new RegExp(key, 'g'), value.toString())
            }
            
            // Simple math evaluation (CAUTION: This is not secure for production)
            // In production, you'd want a proper math expression parser
            const evalResult = Function('"use strict"; return (' + formula + ')')();
            result = `Result: ${typeof evalResult === 'number' ? evalResult.toFixed(2) : evalResult}`
          } catch (e) {
            result = "Error in formula evaluation"
          }
        } else {
          // Fallback: show all inputs as summary
          const summary = spec.fields.map((field: any) => 
            `${field.label}: ${calculatorInputs[field.id]}`
          ).join(', ')
          result = `Input summary: ${summary}`
        }
      }
      
      setCalculatorResult(result)
    } catch (error) {
      console.error('Calculation error:', error)
      setCalculatorResult("Error in calculation")
    }
  }

  const isOwner = user && calculator && user.id === calculator.user_id

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            Loading calculator...
          </div>
        </div>
      </Layout>
    )
  }

  if (!calculator) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Calculator not found</h2>
                <p className="text-muted-foreground mb-4">The calculator you're looking for doesn't exist or has been removed.</p>
                <Button onClick={() => navigate('/')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  const authorInitials = calculator.profile?.full_name
    ? calculator.profile.full_name.split(' ').map(n => n[0]).join('')
    : calculator.profile?.username?.charAt(0).toUpperCase() || '?'

  return (
    <Layout>
      <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1" />
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <DeleteCalculatorDialog
              calculator={calculator}
              onDelete={handleDelete}
            >
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DeleteCalculatorDialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calculator */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalculatorIcon className="text-primary" />
                <CardTitle className="text-2xl">{calculator.title}</CardTitle>
              </div>
              {calculator.description && (
                <CardDescription className="text-base">
                  {calculator.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Calculator Interface */}
              <div className="space-y-4">
                {calculator.spec?.fields?.map((field: any) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-medium">{field.label}</label>
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={calculatorInputs[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  </div>
                ))}
                
                <Button onClick={handleCalculate} className="w-full" size="lg">
                  {calculator.spec?.cta || 'Calculate'}
                </Button>

                {calculatorResult && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Result:</h3>
                      <p className="text-2xl font-bold text-primary">{calculatorResult}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleLike}
                  disabled={isLiking}
                  className={calculator.is_liked ? 'text-red-500 border-red-200' : ''}
                >
                  <Heart className={`mr-2 h-4 w-4 ${calculator.is_liked ? 'fill-current' : ''}`} />
                  {calculator.is_liked ? 'Liked' : 'Like'} ({calculator.likes_count})
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleFork}
                  disabled={isForking || calculator.is_forked}
                >
                  <GitFork className="mr-2 h-4 w-4" />
                  {calculator.is_forked ? 'Forked' : isForking ? 'Forking...' : 'Fork'} ({calculator.forks_count})
                </Button>
                
                <ShareCalculatorDialog
                  calculatorId={calculator.id}
                  calculatorTitle={calculator.title}
                  calculatorDescription={calculator.description}
                >
                  <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </ShareCalculatorDialog>
                
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About Creator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={calculator.profile?.avatar_url} />
                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {calculator.profile?.full_name || calculator.profile?.username || 'Anonymous'}
                  </p>
                  <p className="text-sm text-muted-foreground">Creator</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>{calculator.views_count} views</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created {formatDistanceToNow(new Date(calculator.created_at), { addSuffix: true })}</span>
              </div>

              {calculator.category && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{calculator.category}</Badge>
                </div>
              )}

              {calculator.is_template && (
                <Badge variant="outline" className="w-fit">
                  Template
                </Badge>
              )}

              {calculator.tags && calculator.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {calculator.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specification Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Specification</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto max-h-40">
                {JSON.stringify(calculator.spec, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </Layout>
  )
}

export default CalculatorView
