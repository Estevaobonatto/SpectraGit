import * as React from 'react';
import { PublicTopbar } from '@/components/layout/PublicTopbar';
import { Fade } from '@/components/animate-ui/fade';

export interface LegalSection {
  id: string;
  title: string;
}

interface LegalPageLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  badge?: string;
  sections: LegalSection[];
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  description,
  lastUpdated,
  badge,
  sections,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-surface">
      <PublicTopbar />
      <div className="pt-14">
        {/* Page header */}
        <div className="border-b border-border bg-surface">
          <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
            <Fade direction="up" duration={0.35}>
              {badge && (
                <div className="mb-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                    {badge}
                  </span>
                </div>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">{title}</h1>
              <p className="mt-2 text-sm text-text-secondary max-w-2xl leading-relaxed">{description}</p>
              <p className="mt-3 text-xs text-text-tertiary">Last updated: {lastUpdated}</p>
            </Fade>
          </div>
        </div>

        {/* Content area */}
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12 xl:gap-16">
            {/* Desktop sticky sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-[4.5rem]">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
                  Contents
                </p>
                <nav className="space-y-0.5">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Mobile horizontal pill nav */}
            <div className="lg:hidden -mx-6 px-6 overflow-x-auto">
              <div className="flex gap-2 pb-3">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary hover:bg-surface-hover transition-colors whitespace-nowrap"
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Main prose content */}
            <main className="min-w-0">
              <Fade direction="up" delay={0.12} duration={0.4}>
                <div className="space-y-0">
                  {children}
                </div>
              </Fade>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
