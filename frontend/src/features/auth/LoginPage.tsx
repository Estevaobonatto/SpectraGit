import { GitBranch, GitMerge, Shield, Users, Zap, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PublicTopbar } from '@/components/layout/PublicTopbar';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

const features = [
  {
    icon: GitBranch,
    title: 'Git-native',
    description: 'Full Git protocol support with SSH and HTTPS remotes.',
  },
  {
    icon: GitMerge,
    title: 'Pull Requests',
    description: 'Code review workflows with inline comments and approvals.',
  },
  {
    icon: Users,
    title: 'Teams & Orgs',
    description: 'Granular permissions across organizations and repositories.',
  },
  {
    icon: Shield,
    title: 'Self-hosted',
    description: 'Full control over your data on your own infrastructure.',
  },
  {
    icon: Zap,
    title: 'Fast & modern',
    description: 'Snappy UI built on React and a NestJS REST API.',
  },
  {
    icon: Lock,
    title: 'Secure by default',
    description: 'OAuth 2.0, SSH keys, audit logs and access tokens.',
  },
];

export default function LoginPage() {
  const handleOAuth = (provider: 'google' | 'github') => {
    window.location.href = `${API_BASE}/auth/oauth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicTopbar />

      {/* Main content — offset by topbar height */}
      <div className="flex min-h-[calc(100vh-3.5rem)] pt-14">
        {/* ── Left column: marketing / features ── */}
        <div className="hidden lg:flex flex-col justify-center px-16 xl:px-24 w-[55%] border-r border-border bg-surface/40">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Brand mark */}
            <div className="flex items-center gap-3 mb-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-500 text-white text-lg font-bold shrink-0">
                S
              </div>
              <span className="text-xl font-bold text-text-primary">SpectraGit</span>
            </div>

            <h2 className="text-4xl font-bold text-text-primary leading-tight mb-4">
              Your code,<br />your infrastructure.
            </h2>
            <p className="text-lg text-text-secondary mb-12 max-w-md">
              A self-hosted Git platform built for teams that want full control
              without sacrificing developer experience.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-5 max-w-lg">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-50 text-primary-600">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{f.title}</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{f.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Right column: sign-in form ── */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          {/* Mobile-only brand mark */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-8 text-center lg:hidden"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-primary-500 text-white text-xl font-bold">
              S
            </div>
            <h1 className="text-2xl font-bold text-text-primary">SpectraGit</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Self-hosted Git platform
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-sm"
          >
            <Card>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Welcome back</CardTitle>
                <CardDescription>Sign in to your SpectraGit account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-3 h-11"
                    onClick={() => handleOAuth('github')}
                  >
                    {/* GitHub icon */}
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                    Continue with GitHub
                  </Button>
                </motion.div>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-3 text-xs text-text-tertiary">
                    or
                  </span>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-3 h-11"
                    onClick={() => handleOAuth('google')}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                </motion.div>
              </CardContent>
            </Card>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-5 text-center text-xs text-text-tertiary"
            >
              By signing in, you agree to our{' '}
              <Link to="#" className="underline underline-offset-2 hover:text-text-secondary transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="#" className="underline underline-offset-2 hover:text-text-secondary transition-colors">
                Privacy Policy
              </Link>
              .
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
