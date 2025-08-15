import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoginDialog } from '@/components/auth/LoginDialog'
import { UserProfile } from '@/components/auth/UserProfile'
import { Button } from '@/components/ui/button'
import { Calculator, LogIn } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => navigate('/')}
              >
                <Calculator className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Calculator Platform</span>
              </div>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-6 ml-8">
                <button
                  onClick={() => navigate('/')}
                  className={`text-sm transition-colors hover:text-primary ${
                    location.pathname === '/' ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  Create
                </button>
                <button
                  onClick={() => navigate('/?tab=explore')}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Explore
                </button>
                {user && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className={`text-sm transition-colors hover:text-primary ${
                      location.pathname === '/dashboard' ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    Dashboard
                  </button>
                )}
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              {!loading && (
                user ? (
                  <UserProfile />
                ) : (
                  <LoginDialog>
                    <Button variant="outline" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Button>
                  </LoginDialog>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t">
        <div className="container py-8 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Everything Calculator Platform — Built for creators.
        </div>
      </footer>
    </div>
  )
}
