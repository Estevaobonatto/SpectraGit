import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export default function LoginPage() {
  const handleOAuth = (provider: 'google' | 'github') => {
    window.location.href = `${API_BASE}/auth/oauth/${provider}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-primary-500 text-white text-2xl font-bold">
            S
          </div>
          <h1 className="text-3xl font-bold text-text-primary">SpectraGit</h1>
          <p className="mt-2 text-text-secondary">
            Git repository management & collaboration platform
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Choose your preferred authentication method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-center gap-3 h-11"
              onClick={() => handleOAuth('github')}
            >
              <ExternalLink className="h-5 w-5" />
              Continue with GitHub
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-3 text-xs text-text-tertiary">
                or
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full justify-center gap-3 h-11"
              onClick={() => handleOAuth('google')}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-text-tertiary">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
