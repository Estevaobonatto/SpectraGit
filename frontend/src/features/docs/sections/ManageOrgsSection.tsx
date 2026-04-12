import { Building2, Users, UserPlus, Shield, Settings, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/* ── Local helpers ─────────────────────────────────────────── */
function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 pb-5 border-b border-border last:border-0 last:pb-0">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
        {number}
      </div>
      <div className="space-y-1 flex-1">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <div className="text-sm text-text-secondary">{children}</div>
      </div>
    </div>
  );
}

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
export default function ManageOrgsSection() {
  const roles = [
    { role: 'Owner',  icon: <Crown className="w-4 h-4 text-yellow-500" />,  badge: 'Owner',  color: 'bg-yellow-100 text-yellow-700',
      permissions: ['Gerenciar configurações da org', 'Adicionar/remover membros', 'Criar e deletar times', 'Transferir ou deletar a org', 'Acessar todos os repositórios', 'Alterar visibilidade de repos'] },
    { role: 'Member', icon: <Users className="w-4 h-4 text-blue-500" />,    badge: 'Member', color: 'bg-blue-100 text-blue-700',
      permissions: ['Criar repositórios (conforme política)', 'Criar times (se permitido)', 'Ver todos os membros públicos', 'Participar de repos públicos da org', 'Ser adicionado a times', 'Forkar repos privados (se permitido)'] },
  ];

  const teamAccessLevels = [
    { level: 'Read',     desc: 'Ver e clonar o repositório. Abrir issues e comentar.' },
    { level: 'Triage',   desc: 'Gerenciar issues e PRs sem permissão de escrita no código.' },
    { level: 'Write',    desc: 'Push de código, criar e fazer merge de PRs, gerenciar releases.' },
    { level: 'Maintain', desc: 'Gerenciar o repositório sem acesso a ações sensíveis (delete, etc.).' },
    { level: 'Admin',    desc: 'Controle total do repositório incluindo configurações e exclusão.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <Building2 className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Organizações & Times</h2>
          <p className="text-sm text-text-secondary">
            Organizações permitem centralizar repositórios de um time ou empresa, com controle granular de
            permissões por membro e por time.
          </p>
        </div>
      </div>

      {/* Card 1 — Criar Organização */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Criar uma Organização</h3>
          </div>
          <Step number={1} title="Acesse o painel de criação">
            Clique no ícone <strong>+</strong> no menu superior e selecione <strong>New organization</strong>,
            ou acesse <strong>Configurações do usuário → Organizations → New</strong>.
          </Step>
          <Step number={2} title="Configure a organização">
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong>Nome</strong>: identificador único da org (ex.: <em>minha-empresa</em>)</li>
              <li><strong>E-mail de contato</strong>: usado para notificações da org</li>
              <li><strong>Visibilidade</strong>: pública (qualquer um vê os repos públicos) ou privada</li>
            </ul>
          </Step>
          <Step number={3} title="Convide os primeiros membros">
            Após criar, você pode convidar membros imediatamente inserindo os usernames ou e-mails. Os convidados
            recebem uma notificação e precisam aceitar o convite.
          </Step>
          <TipBox>
            <strong>Namespace dos repos:</strong> Repositórios criados dentro da organização ficam sob o
            namespace <code className="bg-blue-100 px-1 rounded">org/repo-name</code>,
            separando-os dos repos pessoais dos membros.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 2 — Gerenciar Membros */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Gerenciar Membros</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Acesse <strong>Organization Settings → Members</strong> para gerenciar quem faz parte da
            organização e qual função cada pessoa desempenha.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(r => (
              <div key={r.role} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  {r.icon}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.color}`}>{r.badge}</span>
                </div>
                <ul className="space-y-1">
                  {r.permissions.map(p => (
                    <li key={p} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <TipBox variant="warn">
            <strong>Remover membro:</strong> Ao remover um membro da organização, ele perde acesso a todos os
            repositórios privados da org. Repositórios públicos continuam acessíveis para leitura.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 3 — Times */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Times (Teams)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Times agrupam membros da organização e permitem conceder acesso a múltiplos repositórios de uma
            vez, simplificando o gerenciamento de permissões.
          </p>
          <Step number={1} title="Criar um time">
            Acesse <strong>Organization → Teams → New team</strong>. Defina um nome descritivo (ex.:
            <em> frontend</em>, <em>backend</em>, <em>devops</em>) e visibilidade (visível aos membros da org
            ou secreto).
          </Step>
          <Step number={2} title="Adicionar membros ao time">
            Na página do time, clique em <strong>Add member</strong> e selecione os membros da organização.
            Membros de um time recebem automaticamente o nível de acesso configurado para aquele time.
          </Step>
          <Step number={3} title="Conceder acesso a repositórios">
            Na aba <strong>Repositories</strong> do time, clique em <strong>Add repository</strong> e escolha
            o nível de permissão: Read, Triage, Write, Maintain ou Admin.
          </Step>
          <TipBox>
            <strong>Times aninhados:</strong> Você pode criar sub-times dentro de um time pai. Membros de
            sub-times herdam automaticamente os acessos do time pai.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 4 — Níveis de Acesso por Repositório */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Níveis de Acesso por Repositório</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Cada time ou colaborador pode ter um nível de acesso diferente por repositório.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-50">
                  <th className="text-left px-4 py-2 font-medium text-text-primary">Nível</th>
                  <th className="text-left px-4 py-2 font-medium text-text-primary">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teamAccessLevels.map(t => (
                  <tr key={t.level} className="hover:bg-primary-50 transition-colors">
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="font-mono text-xs">{t.level}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{t.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Card 5 — Configurações da Organização */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Configurações da Organização</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Acesse <strong>Organization → Settings</strong> para gerenciar políticas e preferências globais da
            organização.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: 'Permissões base de membros', desc: 'Define o nível mínimo de acesso de qualquer membro a repos da org (None / Read / Write / Admin).' },
              { title: 'Criação de repositórios', desc: 'Controla se membros podem criar repos públicos, privados ou ambos — ou se apenas owners podem criar.' },
              { title: 'Fork de repos privados', desc: 'Permite ou bloqueia que membros façam fork de repositórios privados da organização.' },
              { title: 'Notificações da org', desc: 'E-mail padrão para notificações de segurança, faturamento e eventos da organização.' },
              { title: 'Visibilidade da org', desc: 'Define se a org e seus membros são visíveis publicamente ou somente para membros internos.' },
              { title: 'Transferir ou deletar', desc: 'Transfere a propriedade da org para outro usuário ou deleta permanentemente a organização.' },
            ].map(item => (
              <div key={item.title} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <TipBox variant="warn">
            <strong>Deletar organização</strong> é uma ação irreversível. Todos os repositórios, times e dados
            da org serão permanentemente removidos. Faça um backup antes de prosseguir.
          </TipBox>
        </CardContent>
      </Card>
    </div>
  );
}
