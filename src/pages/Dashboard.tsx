import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { calculatorService, Calculator } from '@/services/calculatorService'
import { CalculatorCard } from '@/components/calculator/CalculatorCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Filter, Calculator as CalculatorIcon, Heart, GitFork, Eye, TrendingUp, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Dashboard: React.FC = () => {
  const [myCalculators, setMyCalculators] = useState<Calculator[]>([])
  const [likedCalculators, setLikedCalculators] = useState<Calculator[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('my-calculators')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user, activeTab, sortBy])

  const loadUserData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      if (activeTab === 'my-calculators') {
        const { data, error } = await calculatorService.getUserCalculators(user.id)
        if (error) throw error
        setMyCalculators(data || [])
      } else if (activeTab === 'liked') {
        // For now, we'll implement a basic liked calculators fetch
        // In a real implementation, you'd want to add this to the service
        const { data, error } = await calculatorService.getCalculators({ limit: 50 })
        if (error) throw error
        setLikedCalculators((data || []).filter(calc => calc.is_liked))
      }
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load calculator data",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleCalculatorSelect = (calculator: Calculator) => {
    // Navigate to calculator view/edit page
    navigate(`/calculator/${calculator.id}`)
  }

  const handleLikeToggle = (calculatorId: string, isLiked: boolean) => {
    const updateList = (list: Calculator[]) =>
      list.map(calc => 
        calc.id === calculatorId 
          ? { ...calc, is_liked: isLiked, likes_count: calc.likes_count + (isLiked ? 1 : -1) }
          : calc
      )
    
    setMyCalculators(updateList)
    setLikedCalculators(updateList)
  }

  const handleFork = (forkedCalculator: Calculator) => {
    toast({
      title: "Calculator forked successfully!",
      description: "The forked calculator has been added to your collection.",
    })
    loadUserData() // Reload to show the new fork
  }

  const filteredCalculators = () => {
    const calculators = activeTab === 'my-calculators' ? myCalculators : likedCalculators
    
    let filtered = calculators.filter(calc => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return calc.title.toLowerCase().includes(query) ||
             calc.description?.toLowerCase().includes(query) ||
             calc.tags?.some(tag => tag.toLowerCase().includes(query))
    })

    // Sort calculators
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'popular':
        filtered.sort((a, b) => b.likes_count - a.likes_count)
        break
      case 'views':
        filtered.sort((a, b) => b.views_count - a.views_count)
        break
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    return filtered
  }

  const getStats = () => {
    const totalViews = myCalculators.reduce((sum, calc) => sum + calc.views_count, 0)
    const totalLikes = myCalculators.reduce((sum, calc) => sum + calc.likes_count, 0)
    const totalForks = myCalculators.reduce((sum, calc) => sum + calc.forks_count, 0)
    const publicCount = myCalculators.filter(calc => calc.is_public).length

    return { totalViews, totalLikes, totalForks, publicCount }
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Sign in required</h2>
                <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  const stats = getStats()

  return (
    <Layout>
      <div className="container py-8 space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Creator'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your calculators and explore your analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CalculatorIcon className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Calculators</p>
                <p className="text-2xl font-bold">{myCalculators.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Likes</p>
                <p className="text-2xl font-bold">{stats.totalLikes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Public Calculators</p>
                <p className="text-2xl font-bold">{stats.publicCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Calculators</CardTitle>
              <CardDescription>
                Manage and organize your calculator collection
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-calculators">My Calculators ({myCalculators.length})</TabsTrigger>
              <TabsTrigger value="liked">Liked ({likedCalculators.length})</TabsTrigger>
            </TabsList>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 mb-6">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search calculators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="title">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="my-calculators">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading your calculators...
                </div>
              ) : filteredCalculators().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'No calculators found matching your search.' : "You haven't created any calculators yet."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => navigate('/')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Calculator
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCalculators().map((calculator) => (
                    <CalculatorCard
                      key={calculator.id}
                      calculator={calculator}
                      onLikeToggle={handleLikeToggle}
                      onFork={handleFork}
                      onView={handleCalculatorSelect}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="liked">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading liked calculators...
                </div>
              ) : filteredCalculators().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'No liked calculators found matching your search.' : "You haven't liked any calculators yet."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => navigate('/')} variant="outline">
                      Explore Gallery
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCalculators().map((calculator) => (
                    <CalculatorCard
                      key={calculator.id}
                      calculator={calculator}
                      onLikeToggle={handleLikeToggle}
                      onFork={handleFork}
                      onView={handleCalculatorSelect}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </Layout>
  )
}

export default Dashboard
