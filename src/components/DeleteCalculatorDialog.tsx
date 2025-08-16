import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { calculatorService, Calculator } from '@/services/calculatorService'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteCalculatorDialogProps {
  children: React.ReactNode
  calculator: Calculator
  onDelete?: (calculatorId: string) => void
}

export const DeleteCalculatorDialog: React.FC<DeleteCalculatorDialogProps> = ({ 
  children, 
  calculator,
  onDelete
}) => {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const { error } = await calculatorService.deleteCalculator(calculator.id)
      
      if (error) {
        toast({
          title: "Delete failed",
          description: error.message || "Failed to delete calculator",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Calculator deleted",
          description: `"${calculator.title}" has been permanently deleted.`,
        })
        onDelete?.(calculator.id)
        setOpen(false)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete calculator",
        variant: "destructive",
      })
    }
    
    setIsDeleting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Calculator
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{calculator.title}"?
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This action cannot be undone. The calculator will be permanently deleted along with:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>All calculator data and specifications</li>
              <li>All likes and engagement metrics</li>
              <li>Any fork relationships</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Forever
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
