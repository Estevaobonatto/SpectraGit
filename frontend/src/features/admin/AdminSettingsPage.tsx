import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useInstanceSettings, useUpdateInstanceSettings } from '@/hooks/useAdmin';

const schema = z.object({
  appName: z.string().min(1).max(100),
  appLogoUrl: z.string().url('Must be a valid URL').max(512).or(z.literal('')).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color like #7C3AED'),
  baseUrl: z.string().url('Must be a valid URL').max(512),
  smtpHost: z.string().max(255).optional().or(z.literal('')),
  smtpPort: z.string().optional(),
  smtpUser: z.string().max(255).optional().or(z.literal('')),
  smtpFromEmail: z.string().email().max(255).optional().or(z.literal('')),
  smtpPassword: z.string().max(512).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useInstanceSettings();
  const update = useUpdateInstanceSettings();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (settings) {
      reset({
        appName: settings.appName,
        appLogoUrl: settings.appLogoUrl ?? '',
        primaryColor: settings.primaryColor,
        baseUrl: settings.baseUrl,
        smtpHost: settings.smtpHost ?? '',
        smtpPort: settings.smtpPort ? String(settings.smtpPort) : '',
        smtpUser: settings.smtpUser ?? '',
        smtpFromEmail: settings.smtpFromEmail ?? '',
        smtpPassword: '',
      });
    }
  }, [settings, reset]);

  const onSubmit = (values: FormValues) => {
    const payload: Record<string, unknown> = {
      appName: values.appName,
      primaryColor: values.primaryColor,
      baseUrl: values.baseUrl,
    };
    if (values.appLogoUrl) payload.appLogoUrl = values.appLogoUrl;
    if (values.smtpHost) payload.smtpHost = values.smtpHost;
    if (values.smtpPort) payload.smtpPort = Number(values.smtpPort);
    if (values.smtpUser) payload.smtpUser = values.smtpUser;
    if (values.smtpFromEmail) payload.smtpFromEmail = values.smtpFromEmail;
    if (values.smtpPassword) payload.smtpPassword = values.smtpPassword;
    update.mutate(payload as Parameters<typeof update.mutate>[0]);
  };

  const primaryColor = watch('primaryColor');
  const isValidColor = /^#[0-9A-Fa-f]{6}$/.test(primaryColor ?? '');

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">Loading settings…</div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Instance Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customize the appearance and behavior of your instance
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding</CardTitle>
            <CardDescription>Customize how your instance looks to users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="appName">Instance name</Label>
              <Input id="appName" {...register('appName')} />
              {errors.appName && (
                <p className="text-xs text-destructive">{errors.appName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appLogoUrl">Logo URL</Label>
              <Input
                id="appLogoUrl"
                placeholder="https://cdn.company.com/logo.png"
                {...register('appLogoUrl')}
              />
              <p className="text-xs text-muted-foreground">
                Direct URL to your logo image (PNG, SVG). Leave empty to use the default.
              </p>
              {errors.appLogoUrl && (
                <p className="text-xs text-destructive">{errors.appLogoUrl.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="primaryColor">Primary color</Label>
              <div className="flex gap-3 items-center">
                <div
                  className="h-9 w-9 rounded-[var(--radius-sm)] border flex-shrink-0 transition-colors"
                  style={{ backgroundColor: isValidColor ? primaryColor : '#7C3AED' }}
                />
                <Input id="primaryColor" placeholder="#7C3AED" {...register('primaryColor')} />
              </div>
              {errors.primaryColor && (
                <p className="text-xs text-destructive">{errors.primaryColor.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instance URL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instance URL</CardTitle>
            <CardDescription>
              The public URL where users access this instance. Used in clone URLs and links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input id="baseUrl" placeholder="https://git.company.com" {...register('baseUrl')} />
              {errors.baseUrl && (
                <p className="text-xs text-destructive">{errors.baseUrl.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SMTP */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email (SMTP)</CardTitle>
            <CardDescription>
              Configure outgoing email. Used for notifications and invitations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="smtpHost">SMTP host</Label>
                <Input id="smtpHost" placeholder="smtp.company.com" {...register('smtpHost')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpPort">Port</Label>
                <Input id="smtpPort" type="text" inputMode="numeric" placeholder="587" {...register('smtpPort')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="smtpUser">SMTP username</Label>
                <Input id="smtpUser" placeholder="noreply@company.com" {...register('smtpUser')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpFromEmail">From email</Label>
                <Input
                  id="smtpFromEmail"
                  placeholder="noreply@company.com"
                  {...register('smtpFromEmail')}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="smtpPassword">
                SMTP password{' '}
                {settings?.smtpPasswordConfigured && (
                  <span className="text-xs text-muted-foreground">(already configured — leave blank to keep)</span>
                )}
              </Label>
              <Input
                id="smtpPassword"
                type="password"
                placeholder={settings?.smtpPasswordConfigured ? '••••••••' : 'Enter password'}
                {...register('smtpPassword')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty || update.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {update.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </div>

        {update.isSuccess && (
          <p className="text-center text-sm text-green-600 dark:text-green-400">
            Settings saved successfully
          </p>
        )}
        {update.isError && (
          <p className="text-center text-sm text-destructive">
            Failed to save settings. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
