// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleDot, FileText, Send, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCreateIssue, useIssueAnalysis, useSimilarIssues } from '@/hooks/useIssues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { IssueTypeSelector } from '@/components/issues/IssueTypeSelector';
import { DynamicIssueForm } from '@/components/issues/DynamicIssueForm';
import { DuplicateDetectionPanel } from '@/components/issues/DuplicateDetectionPanel';
import { IssuePriorityBadge } from '@/components/issues/IssuePriorityBadge';
import { IssueTypeBadge } from '@/components/issues/IssueTypeBadge';
import type { IssueType, IssueAnalysis } from '@/types';
import { motion, AnimatePresence } from 'motion/react';

type Step = 'search' | 'type' | 'form';

export default function IssueNewPage() {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const createIssue = useCreateIssue(owner!, repo!);
  const analyzeIssue = useIssueAnalysis(owner!, repo!);

  const [step, setStep] = useState<Step>('search');
  const [title, setTitle] = useState('');
  const [debouncedTitle, setDebouncedTitle] = useState('');
  const [issueType, setIssueType] = useState<IssueType | undefined>();
  const [body, setBody] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<IssueAnalysis | null>(null);

  // Debounce title for similar issue search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTitle(title), 500);
    return () => clearTimeout(timer);
  }, [title]);

  const { data: similarIssues, isLoading: similarLoading } = useSimilarIssues(
    owner!,
    repo!,
    debouncedTitle,
  );

  const handleProceedToType = useCallback(() => {
    if (title.trim().length < 3) return;
    // Trigger analysis when moving to type step
    analyzeIssue.mutate(
      { title, body: body || undefined },
      {
        onSuccess: (result) => {
          setAnalysis(result);
          if (result.classification?.type && !issueType) {
            setIssueType(result.classification.type as IssueType);
          }
        },
      },
    );
    setStep('type');
  }, [title, body, analyzeIssue, issueType]);

  const handleProceedToForm = () => {
    if (!issueType) return;
    setStep('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build structured body from formData
    let finalBody = body;
    const entries = Object.entries(formData).filter(([, v]) => v.trim());
    if (entries.length > 0) {
      const sections = entries.map(([k, v]) => `### ${k.replace(/([A-Z])/g, ' $1').trim()}\n${v}`).join('\n\n');
      finalBody = finalBody ? `${finalBody}\n\n---\n\n${sections}` : sections;
    }

    createIssue.mutate(
      {
        title,
        body: finalBody || undefined,
        type: issueType,
        priority: analysis?.priority?.level,
        formData: entries.length > 0 ? formData : undefined,
        techContext: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      },
      {
        onSuccess: (issue) => {
          navigate(`/${owner}/${repo}/issues/${issue.number}`);
        },
      },
    );
  };

  const isValid = title.trim().length > 0 && !!issueType;

  return (
    <motion.div
      className="max-w-3xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDot className="h-5 w-5 text-success" />
            New Issue
          </CardTitle>
          <CardDescription>
            Create a new issue to report a bug, request a feature, or start a discussion.
          </CardDescription>

          {/* Progress steps */}
          <div className="flex items-center gap-2 pt-3">
            {(['search', 'type', 'form'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className="h-px w-6 bg-border" />}
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step === s
                      ? 'bg-primary-600 text-white'
                      : (['search', 'type', 'form'].indexOf(step) > i)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs ${step === s ? 'text-text-primary font-medium' : 'text-text-tertiary'}`}>
                  {s === 'search' ? 'Title' : s === 'type' ? 'Type' : 'Details'}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {/* Step 1: Title + Duplicate Detection */}
              {step === 'search' && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="title" className="font-semibold">Title *</Label>
                    </div>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief description of the issue"
                      required
                      autoFocus
                    />
                    <p className="text-xs text-text-tertiary">
                      A clear and concise title helps others understand the issue quickly.
                    </p>
                  </div>

                  {/* Duplicate detection panel */}
                  <DuplicateDetectionPanel
                    issues={similarIssues ?? []}
                    isLoading={similarLoading && debouncedTitle.length >= 3}
                    owner={owner!}
                    repo={repo!}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleProceedToType}
                      disabled={title.trim().length < 3}
                      className="gap-1.5"
                    >
                      Continue
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Type Selection */}
              {step === 'type' && (
                <motion.div
                  key="type"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="font-semibold">Issue Type *</Label>
                    <p className="text-xs text-text-tertiary">
                      Select the type of issue you're creating. This helps with routing and prioritization.
                    </p>
                  </div>

                  {/* AI suggestions */}
                  {analysis && (
                    <div className="rounded-[var(--radius-md)] border border-primary-200 bg-primary-50/50 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-primary-700">
                        <Sparkles className="h-3.5 w-3.5" />
                        Analysis Suggestions
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.classification && (
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <span>Type:</span>
                            <IssueTypeBadge type={analysis.classification.type as IssueType} />
                            <span className="text-text-tertiary">
                              ({Math.round(analysis.classification.confidence * 100)}%)
                            </span>
                          </div>
                        )}
                        {analysis.priority && (
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <span>Priority:</span>
                            <IssuePriorityBadge priority={analysis.priority.level} />
                          </div>
                        )}
                        {analysis.area && (
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <span>Area:</span>
                            <Badge variant="outline" className="text-[10px]">{analysis.area}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <IssueTypeSelector value={issueType} onChange={setIssueType} />

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep('search')} className="gap-1.5">
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleProceedToForm}
                      disabled={!issueType}
                      className="gap-1.5"
                    >
                      Continue
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Dynamic Form */}
              {step === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Summary header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-text-primary">{title}</span>
                    <IssueTypeBadge type={issueType} />
                    {analysis?.priority && <IssuePriorityBadge priority={analysis.priority.level} />}
                  </div>

                  <Separator />

                  <DynamicIssueForm
                    type={issueType!}
                    body={body}
                    onBodyChange={setBody}
                    formData={formData}
                    onFormDataChange={setFormData}
                  />

                  {/* Analysis checklist */}
                  {analysis?.checklist && analysis.checklist.length > 0 && (
                    <div className="rounded-[var(--radius-md)] border border-border bg-surface-hover/30 p-3 space-y-2">
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Checklist</p>
                      {analysis.checklist.map((item: { label: string; required: boolean }, i: number) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                          <input type="checkbox" className="rounded border-border" />
                          {item.label}
                          {item.required && <span className="text-xs text-error">*</span>}
                        </label>
                      ))}
                    </div>
                  )}

                  {createIssue.isError && (
                    <Alert variant="error">
                      {(createIssue.error as Error)?.message ?? 'Failed to create issue'}
                    </Alert>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep('type')} className="gap-1.5">
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back
                      </Button>
                    </div>
                    <div className="flex gap-3">
                      <p className="text-xs text-text-tertiary flex items-center gap-1.5 mr-2">
                        <FileText className="h-3.5 w-3.5" />
                        You can edit the issue after creating it.
                      </p>
                      <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!isValid || createIssue.isPending}
                        className="gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {createIssue.isPending ? 'Creating...' : 'Submit new issue'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
