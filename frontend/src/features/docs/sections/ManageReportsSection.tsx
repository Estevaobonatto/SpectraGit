import { BarChart3, Activity, Bell, FileText, Filter, Download, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/* ── Local helpers ─────────────────────────────────────────── */
function TipBox({ variant = 'info', children }: { variant?: 'info' | 'warn'; children: React.ReactNode }) {
  const styles = variant === 'warn'
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : 'bg-blue-50 border-blue-200 text-blue-700';
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

/* ── Section ────────────────────────────────────────────────── */
export default function ManageReportsSection() {
  const auditEvents = [
    { category: 'Repositório',     events: ['repo.create', 'repo.delete', 'repo.rename', 'repo.archive', 'repo.transfer', 'repo.visibility_change'] },
    { category: 'Acesso',          events: ['member.add', 'member.remove', 'member.role_change', 'collaborator.add', 'collaborator.remove'] },
    { category: 'Branch',          events: ['branch_protection.create', 'branch_protection.update', 'branch_protection.delete', 'branch.create', 'branch.delete'] },
    { category: 'Autenticação',    events: ['login.success', 'login.failed', 'token.create', 'token.revoke', 'ssh_key.add', 'ssh_key.delete'] },
    { category: 'Organization',    events: ['org.create', 'org.delete', 'org.update', 'team.create', 'team.delete', 'team.add_repository'] },
    { category: 'Pull Requests',   events: ['pull_request.merge', 'review.submit', 'review_request.create', 'review_request.remove'] },
  ];

  const notificationPrefs = [
    { option: 'E-mail',      desc: 'Receba notificações diretamente na caixa de entrada. Configure digest diário ou notificações em tempo real.' },
    { option: 'Web',         desc: 'Notificações aparecem no sino 🔔 da interface. Marque como lida individualmente ou em lote.' },
    { option: 'Por repo',    desc: 'Defina preferências diferentes por repositório: Watch (todas), Participating (só menções) ou Ignore.' },
    { option: 'Por evento',  desc: 'Ative ou desative categorias específicas: Issues, PRs, Releases, Forks, Comentários, etc.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <BarChart3 className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Relatórios & Auditoria</h2>
          <p className="text-sm text-text-secondary">
            Monitore atividades, acompanhe estatísticas do projeto, gerencie notificações e acesse registros
            de auditoria detalhados para manter visibilidade total sobre o que acontece no seu repositório.
          </p>
        </div>
      </div>

      {/* Card 1 — Feed de Atividade */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Feed de Atividade</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            O feed de atividade no dashboard exibe eventos recentes de todos os repositórios e organizações que
            você acompanha, em ordem cronológica reversa.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: <Activity className="w-4 h-4 text-blue-600" />,    title: 'Commits recentes',      desc: 'Exibe os últimos commits feitos em repos que você segue, com autor, mensagem e branch.' },
              { icon: <FileText className="w-4 h-4 text-purple-600" />,  title: 'Issues e PRs',          desc: 'Abertura, fechamento e atividades em issues e pull requests dos repos monitorados.' },
              { icon: <Bell className="w-4 h-4 text-amber-600" />,       title: 'Eventos de time',       desc: 'Novos membros, adição de repos a times e mudanças de permissão na organização.' },
              { icon: <Download className="w-4 h-4 text-green-600" />,   title: 'Releases e deploys',    desc: 'Publicação de novas releases e tags em repos que você watch.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <div className="mt-0.5">{item.icon}</div>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <TipBox>
            <strong>Filtrar o feed:</strong> Use os filtros de tipo de evento e repositório no topo do feed
            para focar nos eventos mais relevantes para o seu trabalho atual.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 2 — Estatísticas de Commits */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Estatísticas de Commits</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Acesse estatísticas detalhadas em <strong>Repositório → Insights → Commits</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: 'Por repositório', desc: 'Visualize o volume de commits ao longo do tempo com gráfico de barras por semana ou mês.', badge: 'Repo' },
              { title: 'Por contribuidor', desc: 'Lista de contribuidores ranqueados por número de commits, adições e remoções de linhas.', badge: 'Repositório' },
              { title: 'Por período', desc: 'Filtre o intervalo de datas para comparar atividade entre sprints ou releases.', badge: 'Período' },
            ].map(item => (
              <div key={item.title} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{item.title}</p>
                  <Badge variant="secondary" className="text-xs">{item.badge}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card 3 — Notificações */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Gerenciar Notificações</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure como e quando você quer ser notificado em <strong>Configurações → Notifications</strong>.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-50">
                  <th className="text-left px-4 py-2 font-medium text-text-primary">Canal</th>
                  <th className="text-left px-4 py-2 font-medium text-text-primary">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notificationPrefs.map(n => (
                  <tr key={n.option} className="hover:bg-primary-50 transition-colors">
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="font-mono text-xs">{n.option}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{n.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TipBox>
            <strong>Marcar todas como lidas:</strong> Na caixa de notificações, clique em{' '}
            <em>Mark all as read</em> para limpar rapidamente o sino sem precisar abrir cada notificação
            individualmente.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 4 — Audit Log */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Registro de Auditoria (Audit Log)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Administradores da organização podem acessar o log completo de eventos em{' '}
            <strong>Organization Settings → Audit Log</strong>. Cada entrada registra quem fez o quê, quando
            e de qual IP.
          </p>
          <TipBox variant="warn">
            <strong>Acesso restrito:</strong> O Audit Log é visível apenas para <strong>Owners</strong> da
            organização. Membros comuns não têm acesso a este painel.
          </TipBox>
          <div className="space-y-3">
            {auditEvents.map(cat => (
              <div key={cat.category} className="p-3 rounded-xl border border-border bg-muted/20">
                <p className="font-medium text-sm mb-2">{cat.category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.events.map(ev => (
                    <code key={ev} className="text-xs bg-primary-50 px-2 py-0.5 rounded font-mono text-text-secondary">
                      {ev}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card 5 — Filtros e Exportação */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Filtrar e Exportar Dados</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            O Audit Log suporta filtros avançados para encontrar eventos específicos rapidamente.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: <Clock className="w-4 h-4 text-blue-600" />,   title: 'Por período',     desc: 'Filtre por data de início e fim para auditar um intervalo de tempo específico.' },
              { icon: <Filter className="w-4 h-4 text-purple-600" />, title: 'Por tipo de ação', desc: 'Selecione categorias específicas (repositório, membro, autenticação, etc.).' },
              { icon: <FileText className="w-4 h-4 text-orange-600" />, title: 'Por usuário',    desc: 'Veja todas as ações realizadas por um membro específico da organização.' },
              { icon: <Download className="w-4 h-4 text-green-600" />, title: 'Exportar CSV',   desc: 'Exporte o log filtrado em formato CSV para análise externa ou para arquivamento de conformidade.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <div className="mt-0.5">{item.icon}</div>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <TipBox>
            <strong>Retenção de logs:</strong> Os registros de auditoria são mantidos por{' '}
            <strong>90 dias</strong> por padrão. Exporte regularmente para arquivamento de longo prazo se sua
            organização requerer conformidade com normas de auditoria.
          </TipBox>
        </CardContent>
      </Card>
    </div>
  );
}
