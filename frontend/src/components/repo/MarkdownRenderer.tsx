import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Strip HTML comments before rendering
  const sanitized = content.replace(/<!--[\s\S]*?-->/g, '');

  return (
    <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkEmoji, { accessible: true }]]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const inline = !match && !String(children).includes('\n');

            if (inline) {
              return (
                <code
                  className="rounded bg-surface-hover px-1.5 py-0.5 text-[13px] font-mono text-primary-600 border border-border"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match?.[1] || 'text'}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: 'var(--radius-md, 0.5rem)',
                  fontSize: '13px',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-text-primary border-b border-border pb-2 mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-text-primary border-b border-border pb-1.5 mb-3 mt-5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-text-primary mb-2 mt-4">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-text-primary mb-2 mt-3">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-sm text-text-secondary leading-relaxed mb-3">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary mb-3 ml-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 text-sm text-text-secondary mb-3 ml-2">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary-300 pl-4 py-1 my-3 bg-surface-hover rounded-r-[var(--radius-md)]">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-sm border border-border rounded-[var(--radius-md)]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-hover">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left font-medium text-text-primary">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-text-secondary">{children}</td>
          ),
          hr: () => <hr className="border-border my-4" />,
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt || ''}
              className="max-w-full h-auto rounded-[var(--radius-md)] my-2 inline-block"
              loading="lazy"
              {...(props as React.ImgHTMLAttributes<HTMLImageElement>)}
            />
          ),
          pre: ({ children }) => (
            <div className="my-3 rounded-[var(--radius-md)] overflow-hidden border border-border">
              {children}
            </div>
          ),
        }}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  );
}
