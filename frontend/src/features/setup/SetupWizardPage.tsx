// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ChevronRight, Globe, Palette, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { useInitializeSetup } from '@/hooks/useAdmin';

// ── Zod schemas ─────────────────────────────────────────────────────────────

const step1Schema = z.object({
  appName: z.string().min(1).max(100),
  baseUrl: z.string().url('Must be a valid URL').max(512),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color like #7C3AED'),
});

const step2Schema = z.object({
  adminUsername: z
    .string()
    .min(3)
    .max(39)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i, 'Alphanumeric characters and hyphens only'),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8, 'At least 8 characters').max(128),
  confirmPassword: z.string(),
}).refine((v) => v.adminPassword === v.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// ── Step components ──────────────────────────────────────────────────────────

function Step1({
  defaultValues,
  onNext,
}: {
  defaultValues?: Partial<Step1Data>;
  onNext: (data: Step1Data) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      appName: defaultValues?.appName ?? 'SpectraGit',
      baseUrl: defaultValues?.baseUrl ?? 'http://localhost',
      primaryColor: defaultValues?.primaryColor ?? '#7C3AED',
    },
  });

  const primaryColor = watch('primaryColor');
  const isValidColor = /^#[0-9A-Fa-f]{6}$/.test(primaryColor);

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="appName">Instance name</Label>
        <Input id="appName" placeholder="SpectraGit" {...register('appName')} />
        {errors.appName && (
          <p className="text-sm text-destructive">{errors.appName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="baseUrl">Public base URL</Label>
        <Input id="baseUrl" placeholder="https://git.company.com" {...register('baseUrl')} />
        <p className="text-xs text-muted-foreground">
          The URL where users will access this instance
        </p>
        {errors.baseUrl && (
          <p className="text-sm text-destructive">{errors.baseUrl.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="primaryColor">Brand color</Label>
        <div className="flex gap-3 items-center">
          <div
            className="h-9 w-9 rounded-[var(--radius-sm)] border flex-shrink-0 transition-colors"
            style={{ backgroundColor: isValidColor ? primaryColor : '#7C3AED' }}
          />
          <Input id="primaryColor" placeholder="#7C3AED" {...register('primaryColor')} />
        </div>
        {errors.primaryColor && (
          <p className="text-sm text-destructive">{errors.primaryColor.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full">
        Continue <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}

function Step2({
  defaultValues,
  onBack,
  onNext,
}: {
  defaultValues?: Partial<Step2Data>;
  onBack: () => void;
  onNext: (data: Step2Data) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="adminUsername">Username</Label>
        <Input id="adminUsername" placeholder="admin" {...register('adminUsername')} />
        {errors.adminUsername && (
          <p className="text-sm text-destructive">{errors.adminUsername.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminEmail">Email</Label>
        <Input id="adminEmail" type="email" placeholder="admin@company.com" {...register('adminEmail')} />
        {errors.adminEmail && (
          <p className="text-sm text-destructive">{errors.adminEmail.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminPassword">Password</Label>
        <Input id="adminPassword" type="password" placeholder="Min. 8 characters" {...register('adminPassword')} />
        {errors.adminPassword && (
          <p className="text-sm text-destructive">{errors.adminPassword.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ── Wizard steps config ──────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Instance', icon: Globe },
  { id: 2, label: 'Admin account', icon: Shield },
  { id: 3, label: 'Done', icon: CheckCircle },
];

// ── Main wizard component ─────────────────────────────────────────────────────

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialize = useInitializeSetup();

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2 = async (data: Step2Data) => {
    if (!step1Data) return;
    setError(null);
    try {
      await initialize.mutateAsync({
        appName: step1Data.appName,
        baseUrl: step1Data.baseUrl,
        primaryColor: step1Data.primaryColor,
        adminUsername: data.adminUsername,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
      });
      setCurrentStep(3);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'An error occurred. Please try again.'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground text-2xl font-bold">
            S
          </div>
          <h1 className="text-3xl font-bold text-foreground">SpectraGit Setup</h1>
          <p className="mt-2 text-muted-foreground">Configure your self-hosted instance</p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isDone
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                        ? 'bg-primary/20 text-primary border border-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <div className="h-px w-6 bg-border mx-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              {currentStep === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Instance configuration
                    </CardTitle>
                    <CardDescription>
                      Give your instance a name, set the public URL, and pick a brand color.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        {error}
                      </Alert>
                    )}
                    <Step1 defaultValues={step1Data ?? undefined} onNext={handleStep1} />
                  </CardContent>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Create admin account
                    </CardTitle>
                    <CardDescription>
                      This will be the first system administrator of your instance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        {error}
                      </Alert>
                    )}
                    <Step2
                      onBack={() => setCurrentStep(1)}
                      onNext={handleStep2}
                    />
                  </CardContent>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Setup complete
                    </CardTitle>
                    <CardDescription>
                      Your SpectraGit instance is ready. Sign in with the admin account you just created.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-[var(--radius-md)] bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-700 dark:text-green-300">
                      <p className="font-medium mb-1">Instance initialized successfully</p>
                      <p>
                        You can now sign in and start managing your repositories.
                        Consider adding OAuth providers in <strong>Admin → Settings</strong> for team access.
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-muted/50 border p-4 text-sm space-y-1">
                      <p className="font-medium text-foreground">Instance details</p>
                      <p className="text-muted-foreground">Name: <span className="text-foreground">{step1Data?.appName}</span></p>
                      <p className="text-muted-foreground">Base URL: <span className="text-foreground">{step1Data?.baseUrl}</span></p>
                    </div>
                    <Button className="w-full" onClick={() => navigate('/login')}>
                      Go to sign in
                    </Button>
                  </CardContent>
                </>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Palette className="inline h-3 w-3 mr-1" />
          Self-hosted SpectraGit
        </p>
      </div>
    </div>
  );
}
