import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import PromptComposer from "@/components/PromptComposer";
import CalculatorPreview from "@/components/CalculatorPreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Grid, Sparkles } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'

const Index = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'create')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && (tab === 'create' || tab === 'explore')) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    navigate(`/?tab=${value}`, { replace: true })
  }

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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Create Calculator
            </TabsTrigger>
            <TabsTrigger value="explore" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Explore Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-8">
            <PromptComposer />
            <CalculatorPreview />
          </TabsContent>

          <TabsContent value="explore">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Calculator gallery coming soon!</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
