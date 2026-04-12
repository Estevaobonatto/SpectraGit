import { Book, Globe, Shield, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ResponseFormatDiagram } from '../components/diagrams';

export default function IntroductionSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <Book className="h-5 w-5 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Introdução</h2>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="text-text-secondary leading-relaxed">
            A <strong className="text-text-primary">SpectraGit API</strong> é uma API RESTful que permite interagir programaticamente com
            todos os recursos da plataforma SpectraGit — repositórios Git, branches, commits, issues, pull requests,
            organizações, notificações e mais.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
              <Globe className="h-5 w-5 text-primary-500" />
              <p className="text-sm font-semibold text-text-primary">Base URL</p>
              <code className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded">/api/v1</code>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
              <Shield className="h-5 w-5 text-primary-500" />
              <p className="text-sm font-semibold text-text-primary">Autenticação</p>
              <p className="text-xs text-text-secondary">Bearer JWT Token via OAuth</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
              <Zap className="h-5 w-5 text-primary-500" />
              <p className="text-sm font-semibold text-text-primary">Formato</p>
              <p className="text-xs text-text-secondary">JSON request/response com wrapper padrão</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Formato de Resposta Padrão</h3>
            <ResponseFormatDiagram />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
