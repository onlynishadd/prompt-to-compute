import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft } from 'lucide-react';

interface ResetPasswordFormProps {
  onBack: () => void;
}

export default function ResetPasswordForm({ onBack }: ResetPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (!error) {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="text-sm text-muted-foreground mt-2">
            We've sent password reset instructions to {email}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full"
        >
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={loading || !email.trim()}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="w-full"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sign In
      </Button>
    </form>
  );
}
