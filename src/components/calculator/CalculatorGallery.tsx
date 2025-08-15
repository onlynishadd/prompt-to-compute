import React, { useState, useEffect } from 'react'
import { calculatorService, Calculator } from '@/services/calculatorService'
import { CalculatorCard } from './CalculatorCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Filter, Grid, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CalculatorGalleryProps {
  onCalculatorSelect?: (calculator: Calculator) => void
}

const CATEGORIES = [
  'All',
  'Finance',
  'Health & Fitness',
  'Education',
  'Business',
  'Real Estate',
  'Automotive',
  'Travel',
  'Utility',
  'Personal',
  'Other'
]

export const CalculatorGallery: React.FC<CalculatorGalleryProps> = ({ onCalculatorSelect }) => {
  const [calculators, setCalculators] = useState<Calculator[]>([])
  const [templates, setTemplates] = useState<Calculator[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeTab, setActiveTab] = useState('public')

  const { toast } = useToast()

  useEffect(() => {
    loadCalculators()
  }, [activeTab, selectedCategory, searchQuery])

  const loadCalculators = async () => {
    setLoading(true)
    
    try {
      const filters = {
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        limit: 20,
      }

      if (activeTab === 'templates') {
        const { data, error } = await calculatorService.getTemplateCalculators(20)
        if (error) throw error
        setTemplates(data || [])
      } else {
        const { data, error } = await calculatorService.getPublicCalculators(20)
        if (error) throw error
        
        // Filter by category and search on frontend for now
        let filteredData = data || []
        
        if (selectedCategory !== 'All') {
          filteredData = filteredData.filter(calc => calc.category === selectedCategory)
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filteredData = filteredData.filter(calc => 
            calc.title.toLowerCase().includes(query) ||
            calc.description?.toLowerCase().includes(query) ||
            calc.tags?.some(tag => tag.toLowerCase().includes(query))
          )
        }
        
        setCalculators(filteredData)
      }
    } catch (error: any) {
      toast({
        title: "Error loading calculators",
        description: error.message || "Failed to load calculators",
        variant: "destructive",
      })
    }
    
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadCalculators()
  }

  const handleLikeToggle = (calculatorId: string, isLiked: boolean) => {
    const updateList = (list: Calculator[]) =>
      list.map(calc => 
        calc.id === calculatorId 
          ? { ...calc, is_liked: isLiked, likes_count: calc.likes_count + (isLiked ? 1 : -1) }
          : calc
      )
    
    setCalculators(updateList)
    setTemplates(updateList)
  }

  const handleFork = (forkedCalculator: Calculator) => {
    toast({
      title: "Calculator forked successfully!",
      description: "The forked calculator has been added to your collection.",
    })
  }

  const handleView = (calculator: Calculator) => {
    onCalculatorSelect?.(calculator)
  }

  const handleDelete = (calculatorId: string) => {
    // Remove the deleted calculator from both lists
    setCalculators(prev => prev.filter(calc => calc.id !== calculatorId))
    setTemplates(prev => prev.filter(calc => calc.id !== calculatorId))
    
    toast({
      title: "Calculator deleted",
      description: "Calculator has been removed from the gallery.",
    })
  }

  const displayCalculators = activeTab === 'templates' ? templates : calculators

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            Calculator Gallery
          </CardTitle>
          <CardDescription>
            Discover and use calculators created by the community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="Search calculators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="public" className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                Public Calculators
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="public" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading calculators...
                </div>
              ) : displayCalculators.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery || selectedCategory !== 'All' 
                      ? 'No calculators found matching your criteria.' 
                      : 'No public calculators available yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayCalculators.map((calculator) => (
                    <CalculatorCard
                      key={calculator.id}
                      calculator={calculator}
                      onLikeToggle={handleLikeToggle}
                      onFork={handleFork}
                      onView={handleView}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading templates...
                </div>
              ) : displayCalculators.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery || selectedCategory !== 'All' 
                      ? 'No templates found matching your criteria.' 
                      : 'No templates available yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayCalculators.map((calculator) => (
                    <CalculatorCard
                      key={calculator.id}
                      calculator={calculator}
                      onLikeToggle={handleLikeToggle}
                      onFork={handleFork}
                      onView={handleView}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
