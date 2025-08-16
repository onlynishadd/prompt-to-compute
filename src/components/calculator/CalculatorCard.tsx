import React, { useState } from 'react'
import { Calculator, calculatorService } from '@/services/calculatorService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Heart, GitFork, Eye, Calendar, User, ArrowUpRight, Share2, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ShareCalculatorDialog } from '@/components/ShareCalculatorDialog'
import { DeleteCalculatorDialog } from '@/components/DeleteCalculatorDialog'

interface CalculatorCardProps {
  calculator: Calculator
  onLikeToggle?: (calculatorId: string, isLiked: boolean) => void
  onFork?: (calculator: Calculator) => void
  onView?: (calculator: Calculator) => void
  onDelete?: (calculatorId: string) => void
}

export const CalculatorCard: React.FC<CalculatorCardProps> = ({ 
  calculator,
  onLikeToggle,
  onFork,
  onView,
  onDelete,
}) => {
  const [isLiking, setIsLiking] = useState(false)
  const [isForking, setIsForking] = useState(false)
  const [localIsLiked, setLocalIsLiked] = useState(calculator.is_liked)
  const [localLikesCount, setLocalLikesCount] = useState(calculator.likes_count)
  
  const { user } = useAuth()
  const { toast } = useToast()

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like calculators",
        variant: "destructive",
      })
      return
    }

    setIsLiking(true)
    
    try {
      if (localIsLiked) {
        const { error } = await calculatorService.unlikeCalculator(calculator.id)
        if (!error) {
          setLocalIsLiked(false)
          setLocalLikesCount(prev => prev - 1)
          onLikeToggle?.(calculator.id, false)
          toast({
            title: "Unliked",
            description: "Calculator removed from favorites",
          })
        } else {
          console.error('Unlike error:', error)
          toast({
            title: "Error",
            description: error.message || "Failed to unlike calculator",
            variant: "destructive",
          })
        }
      } else {
        const { error } = await calculatorService.likeCalculator(calculator.id)
        if (!error) {
          setLocalIsLiked(true)
          setLocalLikesCount(prev => prev + 1)
          onLikeToggle?.(calculator.id, true)
          toast({
            title: "Liked!",
            description: "Calculator added to favorites",
          })
        } else {
          console.error('Like error:', error)
          toast({
            title: "Error",
            description: error.message || "Failed to like calculator",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      console.error('Like operation error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update like status",
        variant: "destructive",
      })
    }
    
    setIsLiking(false)
  }

  const handleFork = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user) {
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
        onFork?.(forkedCalculator!)
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

  const handleView = () => {
    onView?.(calculator)
  }

  const handleDelete = (calculatorId: string) => {
    onDelete?.(calculatorId)
  }

  const isOwner = user && user.id === calculator.user_id

  const authorInitials = calculator.profile?.full_name
    ? calculator.profile.full_name.split(' ').map(n => n[0]).join('')
    : calculator.profile?.username?.charAt(0).toUpperCase() || '?'

  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer" onClick={handleView}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {calculator.title}
            </CardTitle>
            {calculator.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {calculator.description}
              </CardDescription>
            )}
          </div>
          <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={calculator.profile?.avatar_url} />
            <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {calculator.profile?.full_name || calculator.profile?.username || 'Anonymous'}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {calculator.category && (
            <Badge variant="secondary" className="text-xs">
              {calculator.category}
            </Badge>
          )}
          {calculator.is_template && (
            <Badge variant="outline" className="text-xs">
              Template
            </Badge>
          )}
          {calculator.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {calculator.tags && calculator.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{calculator.tags.length - 2} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {calculator.views_count}
            </span>
            <span className="flex items-center gap-1">
              <Heart className={`h-3 w-3 ${localIsLiked ? 'fill-current text-red-500' : ''}`} />
              {localLikesCount}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-3 w-3" />
              {calculator.forks_count}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(calculator.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>

      <Separator />
      
      <CardFooter className="pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={localIsLiked ? 'text-red-500' : ''}
            >
              <Heart className={`mr-1 h-4 w-4 ${localIsLiked ? 'fill-current text-red-500' : ''}`} />
              {localIsLiked ? 'Liked' : 'Like'} ({localLikesCount})
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFork}
              disabled={isForking || calculator.is_forked}
            >
              <GitFork className="mr-1 h-4 w-4" />
              {calculator.is_forked ? 'Forked' : isForking ? 'Forking...' : 'Fork'}
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <ShareCalculatorDialog
              calculatorId={calculator.id}
              calculatorTitle={calculator.title}
              calculatorDescription={calculator.description}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Share2 className="mr-1 h-4 w-4" />
                Share
              </Button>
            </ShareCalculatorDialog>
            
            {isOwner && (
              <DeleteCalculatorDialog
                calculator={calculator}
                onDelete={handleDelete}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </DeleteCalculatorDialog>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
