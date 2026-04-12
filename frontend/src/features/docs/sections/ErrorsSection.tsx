import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CodeBlock } from '../components/shared';

const ERROR_ROWS = [
  { code: 400, status: 'Bad Request', cause: 'Parâmetros inválidos, body mal formatado ou validação falhou', solution: 'Verifique os tipos e campos obrigatórios' },
  { code: 401, status: 'Unauthorized', cause: 'Token ausente, expirado ou inválido', solution: 'Adicione o header Authorization ou renove o token' },
  { code: 403, status: 'Forbidden', cause: 'Sem permissão para acessar o recurso', solution: 'Verifique sua role (owner, admin, etc)' },
  { code: 404, status: 'Not Found', cause: 'Recurso não existe ou repo privado', solution: 'Verifique o path e permissões' },
  { code: 409, status: 'Conflict', cause: 'Recurso já existe (ex: nome de repo duplicado)', solution: 'Use um nome diferente ou verifique existência' },
  { code: 422, status: 'Unprocessable Entity', cause: 'Dados válidos mas operação impossível (ex: merge com conflitos)', solution: 'Resolva o conflito antes de tentar novamente' },
  { code: 429, status: 'Too Many Requests', cause: 'Rate limit excedido', solution: 'Aguarde e tente novamente; use backoff exponencial' },
  { code: 500, status: 'Internal Server Error', cause: 'Erro inesperado no servidor', solution: 'Tente novamente; se persistir, contate o admin' },
];

export default function ErrorsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-red-100">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Erros Comuns</h2>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-hover text-text-tertiary text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Causa Comum</th>
                  <th className="px-4 py-3 text-left">Solução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ERROR_ROWS.map((err) => (
                  <tr key={err.code} className="hover:bg-surface-hover/50">
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-bold',
                        err.code < 500 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700',
                      )}>{err.code}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">{err.status}</td>
                    <td className="px-4 py-3 text-text-secondary">{err.cause}</td>
                    <td className="px-4 py-3 text-text-secondary">{err.solution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Exemplo de Resposta de Erro</h3>
            <CodeBlock code={`{
  "data": null,
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-04-11T12:00:00.000Z"
  },
  "error": {
    "statusCode": 401,
    "message": "Invalid or expired token",
    "error": "Unauthorized"
  }
}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
