import { Lock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Endpoint } from '../types';
import { MethodBadge, ParamTable, CodeBlock } from './shared';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/animate-ui/components/radix/accordion';

export function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const hasDetails =
    (endpoint.pathParams?.length ?? 0) > 0 ||
    (endpoint.queryParams?.length ?? 0) > 0 ||
    (endpoint.body?.length ?? 0) > 0 ||
    !!endpoint.response;

  if (!hasDetails) {
    return (
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="w-full flex items-center gap-3 px-4 py-3">
          <MethodBadge method={endpoint.method} />
          <code className="text-sm font-mono text-text-primary flex-1">{endpoint.path}</code>
          <div className="flex items-center gap-2">
            {endpoint.auth && (
              <Badge variant="outline" className="text-xs gap-1">
                <Lock className="h-3 w-3" /> Auth
              </Badge>
            )}
            {endpoint.admin && (
              <Badge variant="outline" className="text-xs gap-1 border-red-300 text-red-600">
                <Shield className="h-3 w-3" /> Admin
              </Badge>
            )}
            <span className="text-xs text-text-tertiary max-w-xs truncate">{endpoint.description}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="border border-border rounded-xl overflow-hidden hover:border-primary-300 transition-colors"
    >
      <AccordionItem value="details" className="border-b-0">
        <AccordionTrigger
          className={cn(
            'px-4 py-3 hover:no-underline hover:bg-surface-hover',
          )}
          showArrow={false}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <MethodBadge method={endpoint.method} />
            <code className="text-sm font-mono text-text-primary">{endpoint.path}</code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {endpoint.auth && (
              <Badge variant="outline" className="text-xs gap-1">
                <Lock className="h-3 w-3" /> Auth
              </Badge>
            )}
            {endpoint.admin && (
              <Badge variant="outline" className="text-xs gap-1 border-red-300 text-red-600">
                <Shield className="h-3 w-3" /> Admin
              </Badge>
            )}
            <span className="text-xs text-text-tertiary max-w-xs truncate">{endpoint.description}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 pt-2 border-t border-border space-y-4 bg-surface-hover/30">
          <p className="text-sm text-text-secondary">{endpoint.description}</p>

          {endpoint.pathParams && endpoint.pathParams.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Parâmetros de Caminho</h5>
              <ParamTable params={endpoint.pathParams} />
            </div>
          )}

          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Query Parameters</h5>
              <ParamTable params={endpoint.queryParams} />
            </div>
          )}

          {endpoint.body && endpoint.body.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Request Body</h5>
              <ParamTable params={endpoint.body} />
            </div>
          )}

          {endpoint.response && (
            <div>
              <h5 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Resposta</h5>
              <CodeBlock code={endpoint.response} />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
