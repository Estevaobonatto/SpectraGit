import React from 'react';
import { FolderGit2, Lock, Globe, Users, Shield, GitBranch, Webhook, Trash2, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
        {n}
      </div>
      <div className="flex-1 pb-5 border-b border-border last:border-0 last:pb-0">
        <p className="text-sm font-semibold text-text-primary mb-1">{title}</p>
        <div className="text-sm text-text-secondary space-y-1">{children}</div>
      </div>
    </div>
  );
}

function TipBox({ type = 'info', children }: { type?: 'info' | 'warn'; children: React.ReactNode }) {
  const styles = type === 'info'
    ? 'bg-blue-50 border-blue-200 text-blue-700'
    : 'bg-amber-50 border-amber-200 text-amber-700';
  const Icon = type === 'info' ? Info : AlertTriangle;
  return (
    <div className={`flex gap-3 p-3 rounded-xl border ${styles}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <p className="text-sm">{children}</p>
    </div>
  );
}

export default function ManageReposSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <FolderGit2 className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Gerenciando Repositórios</h2>
          <p className="text-sm text-text-secondary">Criar, configurar, proteger e organizar seus repositórios</p>
        </div>
      </div>

      {/* Criação */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Criar um Repositório</h3>
          </div>
          <div className="space-y-4">
            <Step n={1} title='Acessar "Novo Repositório"'>
              <p>Clique em <strong className="text-text-primary">+ Novo</strong> no dashboard ou acesse <code className="text-primary-600">/new</code>. Repositórios podem ser criados por usuários ou dentro de uma organização.</p>
            </Step>
            <Step n={2} title="Preencher as informações básicas">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Nome</strong> — identificador único no namespace do dono (letras, números, hífens, underscores)</li>
                <li><strong>Descrição</strong> — resumo do projeto (optional)</li>
                <li><strong>Visibilidade</strong> — Público, Privado ou Interno (org)</li>
                <li><strong>Branch padrão</strong> — geralmente <code className="text-primary-600">main</code></li>
              </ul>
            </Step>
            <Step n={3} title="Opções de inicialização">
              <p>Escolha inicializar com:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs">README.md</Badge>
                <Badge variant="outline" className="text-xs">.gitignore (Node, Python, etc.)</Badge>
                <Badge variant="outline" className="text-xs">Licença (MIT, Apache, GPL...)</Badge>
              </div>
            </Step>
          </div>

          {/* Visibilidade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <div className="p-3 rounded-xl border border-border bg-surface space-y-1">
              <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-emerald-500" /><p className="text-xs font-semibold text-text-primary">Público</p></div>
              <p className="text-xs text-text-secondary">Visível para qualquer pessoa. Pode ser clonado sem login.</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-surface space-y-1">
              <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-amber-500" /><p className="text-xs font-semibold text-text-primary">Privado</p></div>
              <p className="text-xs text-text-secondary">Visível apenas para o dono e colaboradores explícitos.</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-surface space-y-1">
              <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-blue-500" /><p className="text-xs font-semibold text-text-primary">Interno (Org)</p></div>
              <p className="text-xs text-text-secondary">Visível para todos os membros da organização.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Configurações do Repositório</h3>
          </div>
          <p className="text-sm text-text-secondary">Acesse <strong className="text-text-primary">Repositório → ⚙ Configurações</strong> para personalizar o comportamento.</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-hover text-text-tertiary text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Configuração</th>
                  <th className="px-3 py-2 text-left">O que faz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['Renomear', 'Altera o slug do repositório — links antigos deixam de funcionar.'],
                  ['Alterar Visibilidade', 'Tornar público, privado ou interno. Requer confirmação.'],
                  ['Branch Padrão', 'Define qual branch é exibida por padrão e usada como base para PRs.'],
                  ['Features', 'Ativar/desativar Issues, Wiki e Discussions individualmente.'],
                  ['Merge Strategies', 'Permitir somente Merge Commit, Squash ou Rebase.'],
                  ['Auto-delete de branches', 'Remove automaticamente branches após merge de PR.'],
                ].map(([cfg, desc]) => (
                  <tr key={cfg} className="hover:bg-surface-hover/50">
                    <td className="px-3 py-2 font-medium text-text-primary">{cfg}</td>
                    <td className="px-3 py-2 text-text-secondary">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Proteção de Branch */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Regras de Proteção de Branch</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Proteja branches críticas (como <code className="text-primary-600">main</code> e <code className="text-primary-600">production</code>) em <strong className="text-text-primary">Configurações → Branches</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { rule: 'Exigir Pull Request', desc: 'Bloqueia push direto — alterações só entram via PR.' },
              { rule: 'Exigir Reviews', desc: 'Define número mínimo de aprovações antes do merge.' },
              { rule: 'Exigir CI aprovado', desc: 'Integra com webhooks/status checks para obrigar build verde.' },
              { rule: 'Bloquear force push', desc: 'Impede reescrever histórico da branch protegida.' },
              { rule: 'Bloquear exclusão', desc: 'Ninguém pode deletar a branch (nem admins).' },
              { rule: 'Linear history', desc: 'Permite somente merge sem commits de merge (squash/rebase).' },
            ].map((r) => (
              <div key={r.rule} className="flex gap-3 p-3 rounded-xl border border-border bg-surface">
                <Shield className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{r.rule}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <TipBox>
            Regras de proteção se aplicam mesmo para o dono do repositório. Use com cuidado em repos de produção.
          </TipBox>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Webhooks</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Configure webhooks em <strong className="text-text-primary">Configurações → Webhooks</strong> para receber notificações HTTP quando eventos ocorrem no repositório.
          </p>
          <div className="flex flex-wrap gap-2">
            {['push', 'pull_request', 'issues', 'release', 'branch_created', 'branch_deleted', 'collaborator_added'].map((ev) => (
              <Badge key={ev} variant="outline" className="text-xs font-mono">{ev}</Badge>
            ))}
          </div>
          <TipBox type="info">
            O SpectraGit envia um header <code>X-SpectraGit-Event</code> com o nome do evento e <code>X-SpectraGit-Signature</code> com HMAC-SHA256 para verificação de autenticidade.
          </TipBox>
        </CardContent>
      </Card>

      {/* Arquivar/Deletar */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold text-text-primary">Arquivar e Deletar Repositório</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-2">
              <p className="text-sm font-semibold text-amber-700">Arquivar</p>
              <p className="text-xs text-amber-600">O repositório fica em modo somente leitura. Nenhum push, PR ou issue pode ser criado. Ideal para projetos legados que precisam ser preservados.</p>
            </div>
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 space-y-2">
              <p className="text-sm font-semibold text-red-700">Deletar</p>
              <p className="text-xs text-red-600">Exclusão permanente e irreversível de todo o código, issues, PRs e histórico. O SpectraGit exige confirmar digitando o nome do repositório.</p>
            </div>
          </div>
          <TipBox type="warn">
            Exclusão de repositório não pode ser desfeita. Faça backup dos dados importantes antes de deletar.
          </TipBox>
        </CardContent>
      </Card>
    </div>
  );
}
