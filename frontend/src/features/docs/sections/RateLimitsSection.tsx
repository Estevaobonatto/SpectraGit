import { Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function RateLimitsSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-amber-100">
          <Zap className="h-5 w-5 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Rate Limits</h2>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="text-text-secondary text-sm leading-relaxed">
            A API aplica rate limiting para garantir estabilidade. Os limites são:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-surface text-center space-y-2">
              <p className="text-2xl font-bold text-primary-600">100</p>
              <p className="text-xs text-text-secondary">requisições/minuto<br />(Usuário autenticado)</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface text-center space-y-2">
              <p className="text-2xl font-bold text-amber-600">30</p>
              <p className="text-xs text-text-secondary">requisições/minuto<br />(Não autenticado)</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface text-center space-y-2">
              <p className="text-2xl font-bold text-emerald-600">10</p>
              <p className="text-xs text-text-secondary">uploads/minuto<br />(Arquivos / Assets)</p>
            </div>
          </div>
          <p className="text-xs text-text-tertiary">Headers de rate limit incluídos na resposta: <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code></p>
        </CardContent>
      </Card>
    </div>
  );
}
