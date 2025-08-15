import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Share2, Copy, ExternalLink, Twitter, Facebook, Linkedin, Mail, Check } from 'lucide-react'

interface ShareCalculatorDialogProps {
  children: React.ReactNode
  calculatorId: string
  calculatorTitle: string
  calculatorDescription?: string
}

export const ShareCalculatorDialog: React.FC<ShareCalculatorDialogProps> = ({ 
  children, 
  calculatorId,
  calculatorTitle,
  calculatorDescription
}) => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const shareUrl = `${window.location.origin}/calculator/${calculatorId}`
  const shareText = `Check out this calculator: ${calculatorTitle}`
  const fullShareText = calculatorDescription 
    ? `${shareText} - ${calculatorDescription}`
    : shareText

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Calculator link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const shareVia = (platform: string) => {
    let url = ''
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${fullShareText}\n\n${shareUrl}`)}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
        break
    }
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Calculator
          </DialogTitle>
          <DialogDescription>
            Share "{calculatorTitle}" with others
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label htmlFor="share-url">Calculator Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-url"
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button 
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="px-3"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Media Sharing */}
          <div className="space-y-3">
            <Label>Share via</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareVia('twitter')}
                className="flex items-center gap-2"
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                Twitter
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareVia('facebook')}
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareVia('linkedin')}
                className="flex items-center gap-2"
              >
                <Linkedin className="h-4 w-4 text-blue-700" />
                LinkedIn
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareVia('email')}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4 text-gray-600" />
                Email
              </Button>
            </div>
          </div>

          {/* Direct Link Button */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(shareUrl, '_blank')}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Calculator
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
