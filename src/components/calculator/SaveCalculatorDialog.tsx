import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { calculatorService } from '@/services/calculatorService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Save, Loader2, X } from 'lucide-react'

interface SaveCalculatorDialogProps {
  children: React.ReactNode
  prompt: string
  spec: string | null
  onSaved?: (calculator: any) => void
}

const CATEGORIES = [
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

export const SaveCalculatorDialog: React.FC<SaveCalculatorDialogProps> = ({ 
  children, 
  prompt, 
  spec, 
  onSaved 
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isTemplate, setIsTemplate] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const { user } = useAuth()
  const { toast } = useToast()

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim()) && tags.length < 5) {
      setTags([...tags, tag.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save calculators",
        variant: "destructive",
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your calculator",
        variant: "destructive",
      })
      return
    }

    if (!spec) {
      toast({
        title: "No calculator to save",
        description: "Please generate a calculator first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { data: calculator, error } = await calculatorService.createCalculator({
        title: title.trim(),
        description: description.trim() || undefined,
        prompt,
        spec: typeof spec === 'string' ? JSON.parse(spec) : spec,
        is_public: isPublic,
        is_template: isTemplate,
        category: category || undefined,
        tags: tags.length > 0 ? tags : undefined,
      })

      if (error) {
        toast({
          title: "Failed to save calculator",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Calculator saved!",
          description: `"${title}" has been saved to your collection.`,
        })
        setOpen(false)
        onSaved?.(calculator)
        
        // Reset form
        setTitle('')
        setDescription('')
        setCategory('')
        setIsPublic(false)
        setIsTemplate(false)
        setTags([])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save calculator. Please try again.",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Calculator</DialogTitle>
          <DialogDescription>
            Save this calculator to your collection for future use and sharing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Loan Payment Calculator"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Briefly describe what this calculator does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <Input
              id="tags"
              placeholder="Add tags (press Enter to add)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={tags.length >= 5}
            />
            <p className="text-xs text-muted-foreground">
              Add up to 5 tags. Press Enter to add each tag.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Make public</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Public calculators can be discovered and used by others
            </p>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="template"
                checked={isTemplate}
                onCheckedChange={setIsTemplate}
              />
              <Label htmlFor="template">Add to templates</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Templates appear in the community gallery for others to fork
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Calculator
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
