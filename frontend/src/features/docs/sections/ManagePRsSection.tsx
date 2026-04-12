import { GitMerge, GitPullRequest, Eye, CheckCircle2, AlertTriangle, ArrowRightLeft, Code2, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '../components/shared';

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
export default function ManagePRsSection() {
  const mergeStrategies = [
    {
      icon: <GitMerge className="w-5 h-5 text-purple-600" />,
      name: 'Merge Commit',
      badge: 'Padrão',
      badgeColor: 'bg-purple-100 text-purple-700',
      desc: 'Cria um commit de merge preservando todo o histórico de commits da branch de origem.',
      pro: 'Histórico completo preservado',
      con: 'Histórico pode ficar poluído',
    },
    {
      icon: <Code2 className="w-5 h-5 text-blue-600" />,
      name: 'Squash & Merge',
      badge: 'Recomendado',
      badgeColor: 'bg-blue-100 text-blue-700',
      desc: 'Comprime todos os commits da branch em um único commit antes de fazer merge.',
      pro: 'Histórico limpo e linear',
      con: 'Perde granularidade dos commits',
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-green-600" />,
      name: 'Rebase & Merge',
      badge: 'Avançado',
      badgeColor: 'bg-green-100 text-green-700',
      desc: 'Reaplica os commits da branch de origem no topo da branch de destino sem criar commit de merge.',
      pro: 'Histórico linear sem merge commits',
      con: 'Reescreve SHA dos commits',
    },
  ];

  const reviewStates = [
    { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600', state: 'Approved', desc: 'Revisor aprovou o código — PR pode ser mergeado (se todos os requisitos forem atendidos).' },
    { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-600', state: 'Changes requested', desc: 'Revisor solicitou alterações — o autor precisa corrigir e solicitar nova revisão.' },
    { icon: <Eye className="w-4 h-4" />, color: 'text-blue-600', state: 'Commented', desc: 'Revisor deixou comentários sem dar veredito; o PR continua pendente.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <GitPullRequest className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Pull Requests & Code Review</h2>
          <p className="text-sm text-text-secondary">
            Pull requests permitem propor mudanças, discutir código e fazer revisões antes de integrar alterações
            à branch principal.
          </p>
        </div>
      </div>

      {/* Card 1 — Abrir um PR */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Abrir um Pull Request</h3>
          </div>
          <Step number={1} title="Crie uma branch para sua feature">
            Nunca commite diretamente na branch principal. Crie uma branch descritiva para seu trabalho:
            <CodeBlock code={`git checkout -b feat/minha-feature\n# faça suas alterações\ngit add .\ngit commit -m "feat: adiciona nova funcionalidade"\ngit push origin feat/minha-feature`} language="bash" />
          </Step>
          <Step number={2} title="Abra o PR na interface">
            Após o push, o SpectraGit exibirá um banner na página do repositório. Clique em{' '}
            <strong>Compare & pull request</strong> ou vá em <strong>Pull Requests → New pull request</strong>.
          </Step>
          <Step number={3} title="Preencha a descrição do PR">
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong>Título</strong>: resumo claro e conciso da mudança</li>
              <li><strong>Descrição</strong>: o quê foi feito, por quê, como testar, capturas de tela (se UI)</li>
              <li><strong>Reviewers</strong>: @ mencione quem deve revisar</li>
              <li><strong>Labels & Milestone</strong>: categorize e vincule ao marco correto</li>
              <li><strong>Linked issue</strong>: use <code className="bg-primary-50 px-1 rounded">Closes #42</code> para vincular</li>
            </ul>
          </Step>
          <Step number={4} title="Submeta o Pull Request">
            Clique em <strong>Create pull request</strong>. O PR fica visível na aba Pull Requests e os
            revisores recebem notificação.
          </Step>
        </CardContent>
      </Card>

      {/* Card 2 — Processo de Revisão */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Processo de Revisão (Code Review)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Revisores podem comentar em linhas específicas do diff, aprovar ou solicitar mudanças.
          </p>
          <div className="space-y-3">
            {reviewStates.map(r => (
              <div key={r.state} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <span className={`mt-0.5 ${r.color}`}>{r.icon}</span>
                <div>
                  <p className="font-medium text-sm">{r.state}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <TipBox>
            <strong>Responder a um comentário:</strong> Ao corrigir o ponto levantado, clique em{' '}
            <em>Resolve conversation</em> para marcá-lo como resolvido e manter o PR organizado.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 3 — Estratégias de Merge */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Estratégias de Merge</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Escolha a estratégia de merge que melhor se adapta ao fluxo do seu time. As opções disponíveis
            dependem das configurações do repositório.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {mergeStrategies.map(s => (
              <div key={s.name} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  {s.icon}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badgeColor}`}>{s.badge}</span>
                </div>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
                <div className="space-y-1 pt-1 border-t border-border">
                  <p className="text-xs text-green-600"><span className="font-medium">+</span> {s.pro}</p>
                  <p className="text-xs text-red-600"><span className="font-medium">−</span> {s.con}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card 4 — Conflitos */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-text-primary">Resolvendo Conflitos de Merge</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Conflitos ocorrem quando duas branches alteram a mesma linha de um arquivo. Siga os passos abaixo
            para resolvê-los localmente:
          </p>
          <Step number={1} title="Sincronize sua branch com a branch destino">
            <CodeBlock code={`git fetch origin\ngit rebase origin/main\n# ou: git merge origin/main`} language="bash" />
          </Step>
          <Step number={2} title="Identifique e edite os arquivos conflitantes">
            O Git marcará os conflitos com <code className="bg-primary-50 px-1 rounded">{'<<<<<<< HEAD'}</code>,{' '}
            <code className="bg-primary-50 px-1 rounded">{'======='}</code> e{' '}
            <code className="bg-primary-50 px-1 rounded">{'>>>>>>> branch'}</code>. Edite manualmente para manter
            o código correto e remova os marcadores.
          </Step>
          <Step number={3} title="Finalize a resolução e faça push">
            <CodeBlock code={`git add .\ngit rebase --continue  # se usou rebase\n# ou: git commit -m "resolve conflitos"\ngit push origin feat/minha-feature`} language="bash" />
          </Step>
          <TipBox variant="warn">
            <strong>Atenção:</strong> Ao usar <code className="bg-amber-100 px-1 rounded">
            git push --force-with-lease</code> após rebase, avise o time para evitar sobrescrever o trabalho
            de outro colaborador.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 5 — Draft PRs e Auto-merge */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Draft PRs & Auto-merge</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Draft</Badge>
                <p className="font-medium text-sm">Pull Request em Rascunho</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Abra um PR como Draft para sinalizar que o trabalho ainda está em progresso e não está pronto
                para revisão formal. Revisores não são notificados automaticamente. Converta para "Ready for
                review" quando finalizar.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Auto-merge</Badge>
                <p className="font-medium text-sm">Merge Automático</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Ative o auto-merge para que o PR seja mergeado automaticamente assim que todas as proteções de
                branch forem satisfeitas (aprovações, checks de CI, etc.). Útil quando você não quer monitorar
                o PR manualmente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
