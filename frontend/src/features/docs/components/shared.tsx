import { useState } from 'react';
import { cn } from '@/lib/utils';
import { METHOD_COLORS } from '../constants';
import type { Param } from '../types';
import { CopyButton as AnimateCopyButton } from '@/components/animate-ui/components/buttons/copy';

export function MethodBadge({ method }: { method: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border', METHOD_COLORS[method] ?? 'bg-gray-100 text-gray-700')}>
      {method}
    </span>
  );
}

export function CopyButton({ text }: { text: string }) {
  return (
    <AnimateCopyButton
      content={text}
      variant="ghost"
      size="xs"
      className="text-text-tertiary hover:text-text-primary hover:bg-surface-hover"
    />
  );
}

export function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  return (
    <div className="relative group rounded-xl border border-border bg-[#1a1b26] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-[#16171d]">
        <span className="text-xs text-text-tertiary font-mono">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-[#a9b1d6] font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

type OsCodeTab = 'unix' | 'windows';

export function TabbedCodeBlock({
  unix,
  windows,
  unixLang = 'bash',
  windowsLang = 'powershell',
}: {
  unix: string;
  windows: string;
  unixLang?: string;
  windowsLang?: string;
}) {
  const [tab, setTab] = useState<OsCodeTab>('unix');
  const code = tab === 'unix' ? unix : windows;
  const lang = tab === 'unix' ? unixLang : windowsLang;
  return (
    <div className="relative group rounded-xl border border-border bg-[#1a1b26] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-[#16171d]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('unix')}
            className={cn(
              'text-xs px-2.5 py-1 rounded font-mono transition-colors',
              tab === 'unix' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60',
            )}
          >
            Linux / macOS
          </button>
          <button
            onClick={() => setTab('windows')}
            className={cn(
              'text-xs px-2.5 py-1 rounded font-mono transition-colors',
              tab === 'windows' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60',
            )}
          >
            Windows (PowerShell)
          </button>
          <span className="ml-2 text-xs text-white/20 font-mono">{lang}</span>
        </div>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-[#a9b1d6] font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

export function ParamTable({ params }: { params: Param[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-hover text-text-tertiary text-xs uppercase tracking-wider">
            <th className="px-3 py-2 text-left">Parâmetro</th>
            <th className="px-3 py-2 text-left">Tipo</th>
            <th className="px-3 py-2 text-left">Obrigatório</th>
            <th className="px-3 py-2 text-left">Descrição</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {params.map((p) => (
            <tr key={p.name} className="hover:bg-surface-hover/50">
              <td className="px-3 py-2 font-mono text-primary-600">{p.name}</td>
              <td className="px-3 py-2 text-text-secondary">{p.type}</td>
              <td className="px-3 py-2">
                {p.required ? (
                  <span className="text-red-500 text-xs font-medium">Sim</span>
                ) : (
                  <span className="text-text-tertiary text-xs">Não{p.default ? ` (default: ${p.default})` : ''}</span>
                )}
              </td>
              <td className="px-3 py-2 text-text-secondary">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
