import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import AuthModal from '@/components/auth/AuthModal';
import UserMenu from '@/components/auth/UserMenu';
import { Sparkles } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Everything Calculator</span>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </Button>
              <Button
                onClick={() => setAuthModalOpen(true)}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </header>
  );
}

