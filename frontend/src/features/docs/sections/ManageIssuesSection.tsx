import { ListTodo, Tag, MessageSquare, Filter, Milestone, Link2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
export default function ManageIssuesSection() {
  const labelTypes = [
    { name: 'bug',              color: 'bg-red-100 text-red-700',       desc: 'Problema ou erro inesperado' },
    { name: 'enhancement',     color: 'bg-purple-100 text-purple-700', desc: 'Nova funcionalidade solicitada' },
    { name: 'documentation',   color: 'bg-blue-100 text-blue-700',    desc: 'Melhoria na documentação' },
    { name: 'question',        color: 'bg-yellow-100 text-yellow-700', desc: 'Dúvida ou pedido de esclarecimento' },
    { name: 'good first issue', color: 'bg-green-100 text-green-700', desc: 'Boa para novos contribuidores' },
    { name: 'wontfix',         color: 'bg-gray-100 text-gray-700',    desc: 'Não será corrigido ou implementado' },
  ];

  const filterOptions = [
    { icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, name: 'Estado',     desc: 'Aberta, fechada ou todas' },
    { icon: <Tag className="w-4 h-4 text-purple-600" />,         name: 'Labels',     desc: 'Filtrar por uma ou várias tags' },
    { icon: <Filter className="w-4 h-4 text-blue-600" />,        name: 'Assignee',   desc: 'Issues atribuídas a um usuário' },
    { icon: <Milestone className="w-4 h-4 text-orange-600" />,   name: 'Milestone',  desc: 'Issues de um marco específico' },
    { icon: <MessageSquare className="w-4 h-4 text-gray-600" />, name: 'Comentários', desc: 'Ordenar por nº de comentários' },
    { icon: <AlertCircle className="w-4 h-4 text-red-600" />,    name: 'Menção',     desc: 'Issues onde você foi mencionado' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <ListTodo className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Issues & Rastreamento</h2>
          <p className="text-sm text-text-secondary">
            Use issues para rastrear bugs, solicitar funcionalidades e organizar o trabalho do seu projeto.
          </p>
        </div>
      </div>

      {/* Card 1 — Criar uma Issue */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Criar uma Issue</h3>
          </div>
          <Step number={1} title="Acesse a aba Issues do repositório">
            No repositório desejado, clique na aba <strong>Issues</strong> no menu superior, depois clique em{' '}
            <strong>New Issue</strong>.
          </Step>
          <Step number={2} title="Preencha os detalhes">
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong>Título</strong>: descrição curta e objetiva do problema ou pedido</li>
              <li><strong>Descrição</strong>: contexto completo, passos para reproduzir (se for bug), comportamento esperado vs. atual</li>
              <li><strong>Labels</strong>: categorize a issue com uma ou mais tags</li>
              <li><strong>Assignees</strong>: atribua a issue a um ou mais colaboradores</li>
              <li><strong>Milestone</strong>: vincule a um marco de lançamento (opcional)</li>
            </ul>
          </Step>
          <Step number={3} title="Submeta e acompanhe">
            Clique em <strong>Submit new issue</strong>. A issue recebe um número único (ex.: #42) e aparece na
            listagem. Qualquer colaborador pode comentar, reagir e fechar a issue quando o problema for resolvido.
          </Step>
          <TipBox>
            <strong>Dica:</strong> Use a sintaxe <code className="bg-blue-100 px-1 rounded">
            Fixes #42</code> num commit ou PR para fechar a issue automaticamente ao fazer merge.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 2 — Labels */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Labels (Etiquetas)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Labels ajudam a categorizar, priorizar e filtrar issues. Você pode criar labels personalizadas em{' '}
            <strong>Issues → Labels</strong>.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-50">
                  <th className="text-left px-4 py-2 font-medium text-text-primary">Label</th>
                  <th className="text-left px-4 py-2 font-medium text-text-primary">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {labelTypes.map(l => (
                  <tr key={l.name} className="hover:bg-primary-50 transition-colors">
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${l.color}`}>
                        {l.name}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{l.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TipBox>
            <strong>Labels personalizadas</strong>: Vá em <strong>Issues → Labels → New label</strong>, defina
            nome, descrição e cor hexadecimal para criar sua própria categoria.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 3 — Comentários e Menções */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Comentários e Menções</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: '@', title: 'Mencionar usuário', desc: 'Use @username para notificar um colaborador diretamente no comentário.' },
              { icon: '#', title: 'Referenciar issue/PR', desc: 'Use #123 para criar um link automático para outra issue ou pull request.' },
              { icon: '✓', title: 'Marcar como resolvido', desc: 'O autor ou um colaborador com permissão pode fechar a issue a qualquer momento.' },
              { icon: '↩', title: 'Reabrir', desc: 'Issues fechadas podem ser reabertas caso o problema reapareça ou precise de mais trabalho.' },
            ].map(item => (
              <div key={item.title} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{item.icon}</span>
                  <p className="font-medium text-sm">{item.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card 4 — Filtros e Busca */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Filtros e Busca</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            A barra de filtro da listagem de issues oferece diversas opções para encontrar exatamente o que você
            precisa.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filterOptions.map(opt => (
              <div key={opt.name} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <div className="mt-0.5">{opt.icon}</div>
                <div>
                  <p className="font-medium text-sm">{opt.name}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card 5 — Milestones */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Milestone className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Milestones (Marcos)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Milestones agrupam issues e pull requests em torno de uma meta com prazo, como uma versão ou sprint.
          </p>
          <Step number={1} title="Criar um Milestone">
            Vá em <strong>Issues → Milestones → New milestone</strong>. Dê um título (ex.: <em>v1.2.0</em>),
            descrição opcional e data de vencimento.
          </Step>
          <Step number={2} title="Associar issues">
            Ao criar ou editar uma issue, selecione o milestone desejado no painel lateral direito.
          </Step>
          <Step number={3} title="Acompanhar progresso">
            Na listagem de milestones, você vê a barra de progresso com o percentual de issues fechadas versus
            abertas naquele marco.
          </Step>
          <TipBox>
            <strong>Vincular PR ao Milestone:</strong> Você também pode atribuir pull requests a um milestone
            para acompanhar todo o trabalho relacionado a um lançamento em um só lugar.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 6 — Vincular Issues a PRs */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Vincular Issues a Pull Requests</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Use palavras-chave no título ou corpo do PR para fechar issues automaticamente no merge.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-50">
                  <th className="text-left px-4 py-2 font-medium text-text-primary">Palavra-chave</th>
                  <th className="text-left px-4 py-2 font-medium text-text-primary">Exemplo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['fixes / fix',    'Fixes #42'],
                  ['closes / close', 'Closes #12'],
                  ['resolves',       'Resolves #7'],
                ].map(([kw, ex]) => (
                  <tr key={kw} className="hover:bg-primary-50 transition-colors">
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="font-mono text-xs">{kw}</Badge>
                    </td>
                    <td className="px-4 py-2 font-mono text-muted-foreground">{ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TipBox variant="warn">
            O fechamento automático só ocorre quando o PR é mergeado na branch <strong>padrão</strong> do
            repositório. Merges em outras branches não fecham a issue.
          </TipBox>
        </CardContent>
      </Card>
    </div>
  );
}
