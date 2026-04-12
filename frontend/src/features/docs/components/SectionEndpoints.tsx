import type { Endpoint } from '../types';
import { EndpointCard } from './EndpointCard';

export function SectionEndpoints({ title, icon: Icon, endpoints, description }: { title: string; icon: React.ElementType; endpoints: Endpoint[]; description?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-primary-100">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          {description && <p className="text-sm text-text-secondary">{description}</p>}
        </div>
      </div>
      <div className="space-y-2">
        {endpoints.map((ep, i) => (
          <EndpointCard key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} />
        ))}
      </div>
    </div>
  );
}
