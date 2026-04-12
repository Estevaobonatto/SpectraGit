import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import type { IssueType } from '@/types';

interface DynamicIssueFormProps {
  type: IssueType;
  body: string;
  onBodyChange: (body: string) => void;
  formData: Record<string, string>;
  onFormDataChange: (data: Record<string, string>) => void;
}

interface FormField {
  key: string;
  label: string;
  placeholder: string;
  type: 'input' | 'textarea';
  required?: boolean;
}

const formFieldsByType: Record<string, FormField[]> = {
  BUG: [
    { key: 'stepsToReproduce', label: 'Steps to Reproduce *', placeholder: '1. Go to...\n2. Click on...\n3. Observe...', type: 'textarea', required: true },
    { key: 'expectedBehavior', label: 'Expected Behavior', placeholder: 'What did you expect to happen?', type: 'textarea' },
    { key: 'actualBehavior', label: 'Actual Behavior', placeholder: 'What actually happened?', type: 'textarea' },
    { key: 'environment', label: 'Environment', placeholder: 'OS, browser, version...', type: 'input' },
  ],
  FEATURE: [
    { key: 'problem', label: 'Problem Statement', placeholder: 'What problem does this feature solve?', type: 'textarea' },
    { key: 'proposedSolution', label: 'Proposed Solution', placeholder: 'How should this feature work?', type: 'textarea' },
    { key: 'alternatives', label: 'Alternatives Considered', placeholder: 'What other approaches did you consider?', type: 'textarea' },
  ],
  QUESTION: [
    { key: 'context', label: 'Context', placeholder: 'What are you trying to accomplish?', type: 'textarea' },
    { key: 'whatTried', label: 'What I\'ve Tried', placeholder: 'Steps you\'ve already taken...', type: 'textarea' },
  ],
  SUPPORT: [
    { key: 'description', label: 'Detailed Description *', placeholder: 'Describe your problem in detail...', type: 'textarea', required: true },
    { key: 'errorMessages', label: 'Error Messages', placeholder: 'Paste any error messages here...', type: 'textarea' },
    { key: 'environment', label: 'Environment', placeholder: 'OS, browser, version...', type: 'input' },
  ],
  IMPROVEMENT: [
    { key: 'currentBehavior', label: 'Current Behavior', placeholder: 'How does it work currently?', type: 'textarea' },
    { key: 'proposedImprovement', label: 'Proposed Improvement *', placeholder: 'How should it be improved?', type: 'textarea', required: true },
    { key: 'motivation', label: 'Motivation', placeholder: 'Why is this improvement needed?', type: 'textarea' },
  ],
};

export function DynamicIssueForm({ type, body, onBodyChange, formData, onFormDataChange }: DynamicIssueFormProps) {
  const fields = formFieldsByType[type] ?? [];

  const handleFieldChange = (key: string, value: string) => {
    onFormDataChange({ ...formData, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* General description */}
      <div className="space-y-2">
        <Label htmlFor="body" className="font-semibold">
          Description
          <span className="ml-2 text-[10px] font-normal text-text-tertiary uppercase tracking-wider">Markdown supported</span>
        </Label>
        <MarkdownEditor
          id="body"
          value={body}
          onChange={onBodyChange}
          placeholder="Additional context about this issue… **bold**, _italic_, `code`, etc."
          rows={5}
        />
      </div>

      {/* Type-specific fields */}
      {fields.length > 0 && (
        <div className="space-y-4 rounded-[var(--radius-md)] border border-border bg-surface-hover/30 p-4">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            {type.charAt(0) + type.slice(1).toLowerCase()} Details
          </p>
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-sm">
                {field.label}
              </Label>
              {field.type === 'textarea' ? (
                <MarkdownEditor
                  id={field.key}
                  value={formData[field.key] ?? ''}
                  onChange={(v) => handleFieldChange(field.key, v)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  id={field.key}
                  value={formData[field.key] ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
