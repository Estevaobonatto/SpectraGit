import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        // Headings
        h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 text-text-primary">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1.5 text-text-primary">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-text-primary">{children}</h3>,
        // Paragraph
        p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0 text-text-primary">{children}</p>,
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            {children}
          </a>
        ),
        // Inline code
        code: ({ children, className: cls }) => {
          const isBlock = cls?.includes('language-');
          if (isBlock) {
            return (
              <code className={cn('block bg-surface-raised rounded-[var(--radius-sm)] px-3 py-2 text-xs font-mono overflow-x-auto text-text-primary', cls)}>
                {children}
              </code>
            );
          }
          return (
            <code className="bg-surface-raised rounded px-1 py-0.5 text-xs font-mono text-text-primary">
              {children}
            </code>
          );
        },
        // Code block
        pre: ({ children }) => (
          <pre className="bg-surface-raised rounded-[var(--radius-sm)] p-3 my-2 overflow-x-auto text-xs">
            {children}
          </pre>
        ),
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-border pl-3 my-2 text-text-secondary italic">
            {children}
          </blockquote>
        ),
        // Lists
        ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-2 text-sm text-text-primary">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-2 text-sm text-text-primary">{children}</ol>,
        li: ({ children }) => <li className="text-sm text-text-primary">{children}</li>,
        // Horizontal rule
        hr: () => <hr className="border-border my-3" />,
        // Table (GFM)
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full text-sm border-collapse border border-border rounded-[var(--radius-sm)]">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-surface-hover">{children}</thead>,
        th: ({ children }) => (
          <th className="border border-border px-3 py-1.5 text-left text-xs font-semibold text-text-primary">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-1.5 text-xs text-text-primary">
            {children}
          </td>
        ),
        // Checkbox (GFM task lists)
        input: ({ type, checked }) => {
          if (type === 'checkbox') {
            return (
              <input
                type="checkbox"
                checked={checked}
                readOnly
                className="mr-1.5 h-3.5 w-3.5 rounded border-border accent-primary-600"
              />
            );
          }
          return null;
        },
        // Strong / Em
        strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
        em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
