import { Network, Database, Workflow, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ArchitectureDiagram } from '../components/diagrams';

export default function ArchitectureSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <Network className="h-5 w-5 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Arquitetura</h2>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <p className="text-text-secondary leading-relaxed">
            O SpectraGit segue uma arquitetura modular com <strong className="text-text-primary">NestJS</strong> no backend,{' '}
            <strong className="text-text-primary">React</strong> no frontend, <strong className="text-text-primary">PostgreSQL</strong>{' '}
            como banco principal e <strong className="text-text-primary">Redis/BullMQ</strong> para filas de jobs assíncronos.
          </p>

          <h3 className="text-sm font-semibold text-text-primary">Diagrama de Arquitetura</h3>
          <ArchitectureDiagram />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-500" /> Camada de Dados
              </h4>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• <strong>Prisma ORM</strong> para PostgreSQL (dados relacionais)</li>
                <li>• <strong>SimpleGit</strong> para operações Git no filesystem</li>
                <li>• <strong>Redis</strong> para cache e filas BullMQ</li>
                <li>• Repos armazenados em <code className="text-primary-600">/data/repositories/</code></li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Workflow className="h-4 w-4 text-amber-500" /> Jobs Assíncronos
              </h4>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• <strong>github-sync</strong> — Sincronização com GitHub</li>
                <li>• <strong>git-reconciliation</strong> — Sync branches disco→BD</li>
                <li>• Processados via BullMQ workers</li>
                <li>• Monitoráveis por status de job</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary-500" /> Middlewares Globais
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-primary-50 text-primary-700 text-center font-medium">ValidationPipe</div>
              <div className="p-2 rounded-lg bg-primary-50 text-primary-700 text-center font-medium">TransformInterceptor</div>
              <div className="p-2 rounded-lg bg-primary-50 text-primary-700 text-center font-medium">LoggingInterceptor</div>
              <div className="p-2 rounded-lg bg-primary-50 text-primary-700 text-center font-medium">HttpExceptionFilter</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
