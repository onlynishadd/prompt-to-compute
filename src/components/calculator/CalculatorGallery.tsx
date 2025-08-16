import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, Heart, Eye, Search, Loader2, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Calculator {
  id: string;
  title: string;
  prompt: string;
  spec: any;
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

interface CalculatorGalleryProps {
  onCalculatorSelect: (calculator: Calculator) => void;
}

export default function CalculatorGallery({ onCalculatorSelect }: CalculatorGalleryProps) {
  const { user } = useAuth();
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    loadPublicCalculators();
  }, [sortBy, filterBy]);

  const loadPublicCalculators = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('calculators')
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .eq('is_public', true);

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most_liked':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'most_viewed':
          query = query.order('views_count', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading calculators:', error);
        return;
      }

      setCalculators(data || []);
    } catch (error) {
      console.error('Error loading calculators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (calculatorId: string) => {
    if (!user) {
      // Show sign in prompt
      return;
    }

    try {
      const { error } = await supabase
        .from('calculator_likes')
        .insert({
          calculator_id: calculatorId,
          user_id: user.id,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          // Unlike the calculator
          await supabase
            .from('calculator_likes')
            .delete()
            .eq('calculator_id', calculatorId)
            .eq('user_id', user.id);
        } else {
          console.error('Error liking calculator:', error);
          return;
        }
      }

      // Reload calculators to update like counts
      loadPublicCalculators();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleView = async (calculator: Calculator) => {
    // Increment view count
    try {
      await supabase.rpc('increment_calculator_views', {
        calc_id: calculator.id
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }

    // Navigate to calculator view
    onCalculatorSelect(calculator);
  };

  const filteredCalculators = calculators.filter(calculator => {
    const matchesSearch = calculator.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         calculator.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'recent' && isRecent(calculator.created_at)) return matchesSearch;
    if (filterBy === 'popular' && calculator.likes_count > 5) return matchesSearch;
    
    return matchesSearch;
  });

  const isRecent = (createdAt: string) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(createdAt) > oneWeekAgo;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading calculators...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search calculators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most_liked">Most Liked</SelectItem>
              <SelectItem value="most_viewed">Most Viewed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[120px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredCalculators.length} calculator{filteredCalculators.length !== 1 ? 's' : ''} found
      </div>

      {/* Calculator Grid */}
      {filteredCalculators.length === 0 ? (
        <div className="text-center py-12">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No calculators found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'Be the first to create a public calculator!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCalculators.map((calculator) => (
            <Card key={calculator.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{calculator.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {formatDate(calculator.created_at)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {calculator.prompt}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Creator Info */}
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                  <span>by {calculator.users?.full_name || calculator.users?.email?.split('@')[0] || 'Anonymous'}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {calculator.views_count || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {calculator.likes_count || 0}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleView(calculator)}
                  >
                    View Calculator
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(calculator.id)}
                    className={user ? 'hover:text-red-500' : ''}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
