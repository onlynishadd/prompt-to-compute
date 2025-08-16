import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import ResetPasswordForm from './ResetPasswordForm';

type AuthView = 'signin' | 'signup' | 'reset-password';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: AuthView;
}

export default function AuthModal({ open, onOpenChange, defaultView = 'signin' }: AuthModalProps) {
  const [currentView, setCurrentView] = useState<AuthView>(defaultView);

  const handleViewChange = (view: AuthView) => {
    setCurrentView(view);
  };

  const renderForm = () => {
    switch (currentView) {
      case 'signin':
        return (
          <SignInForm
            onSwitchToSignUp={() => handleViewChange('signup')}
            onSwitchToResetPassword={() => handleViewChange('reset-password')}
          />
        );
      case 'signup':
        return (
          <SignUpForm
            onSwitchToSignIn={() => handleViewChange('signin')}
          />
        );
      case 'reset-password':
        return (
          <ResetPasswordForm
            onBackToSignIn={() => handleViewChange('signin')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex justify-center">
          {renderForm()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

