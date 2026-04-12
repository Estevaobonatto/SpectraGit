import { Rocket, User, Key, GitBranch, Terminal, LayoutDashboard, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '../components/shared';

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
        {n}
      </div>
      <div className="flex-1 pb-6 border-b border-border last:border-0 last:pb-0">
        <p className="text-sm font-semibold text-text-primary mb-1">{title}</p>
        <div className="text-sm text-text-secondary space-y-2">{children}</div>
      </div>
    </div>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
      <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
      <p className="text-sm text-blue-700">{children}</p>
    </div>
  );
}

export default function UserGuideSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <Rocket className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Primeiros Passos</h2>
          <p className="text-sm text-text-secondary">Como começar a usar o SpectraGit do zero</p>
        </div>
      </div>

      {/* Criar conta */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Criar Conta e Configurar Perfil</h3>
          </div>
          <div className="space-y-4">
            <Step n={1} title="Registrar-se na plataforma">
              <p>Acesse a página inicial e clique em <strong className="text-text-primary">Entrar com Google</strong> ou <strong className="text-text-primary">Entrar com GitHub</strong>. O SpectraGit usa OAuth — não é necessário criar senha.</p>
            </Step>
            <Step n={2} title="Completar o perfil">
              <p>Acesse <strong className="text-text-primary">Configurações → Perfil</strong> e preencha:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li><strong>Nome de exibição</strong> — nome visível para outros usuários</li>
                <li><strong>Username</strong> — identificador único (ex: <code className="text-primary-600">@johndoe</code>)</li>
                <li><strong>Bio</strong> — descrição curta sobre você</li>
                <li><strong>Avatar</strong> — foto de perfil (upload de imagem)</li>
                <li><strong>Localização e Website</strong> — opcionais</li>
              </ul>
            </Step>
            <Step n={3} title="Personalizar visibilidade">
              <p>Em <strong className="text-text-primary">Configurações → Privacidade</strong> você controla quais informações do seu perfil são públicas ou privadas.</p>
            </Step>
          </div>
        </CardContent>
      </Card>

      {/* SSH Keys */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Configurar Chaves SSH</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Chaves SSH permitem clonar e fazer push em repositórios sem digitar senha. Recomendado para uso diário.
          </p>
          <div className="space-y-4">
            <Step n={1} title="Gerar chave SSH no terminal">
              <CodeBlock language="bash" code={`# Gerar par de chaves Ed25519 (recomendado)
ssh-keygen -t ed25519 -C "seu@email.com"

# Aceite o caminho padrão (~/.ssh/id_ed25519) e defina uma passphrase

# Ver a chave pública gerada
cat ~/.ssh/id_ed25519.pub`} />
            </Step>
            <Step n={2} title="Adicionar a chave ao SpectraGit">
              <p>Copie a chave pública e acesse <strong className="text-text-primary">Configurações → Chaves SSH</strong>. Clique em <strong className="text-text-primary">Adicionar Chave SSH</strong>, cole o conteúdo e dê um nome (ex: "Meu notebook").</p>
            </Step>
            <Step n={3} title="Testar a conexão">
              <CodeBlock language="bash" code={`# Substitua pela URL da sua instância SpectraGit
ssh -T git@seu-servidor.com

# Resposta esperada:
# ✓ Autenticado como johndoe no SpectraGit`} />
            </Step>
          </div>
          <TipBox>
            Se a sua instância usa uma porta SSH personalizada, configure o arquivo <code>~/.ssh/config</code> com <code>Host seu-servidor.com / Port 2222</code>.
          </TipBox>
        </CardContent>
      </Card>

      {/* Primeiro repositório */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Criar e Clonar o Primeiro Repositório</h3>
          </div>
          <div className="space-y-4">
            <Step n={1} title='Clicar em "Novo Repositório"'>
              <p>No dashboard, clique no botão <Badge className="text-xs bg-primary-600 text-white">+ Novo</Badge> ou acesse <strong className="text-text-primary">Repositórios → Criar Repositório</strong>. Preencha nome, descrição e visibilidade.</p>
            </Step>
            <Step n={2} title="Inicializar com README">
              <p>Marque a opção <strong className="text-text-primary">Inicializar com README</strong> para já ter um commit inicial. Você pode também selecionar um <code>.gitignore</code> e licença pré-prontos.</p>
            </Step>
            <Step n={3} title="Clonar localmente">
              <CodeBlock language="bash" code={`# Via SSH (recomendado)
git clone git@seu-servidor.com:johndoe/meu-projeto.git

# Via HTTPS
git clone https://seu-servidor.com/johndoe/meu-projeto.git

# Entrar na pasta e começar a trabalhar
cd meu-projeto
git status`} />
            </Step>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Entendendo o Dashboard</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Feed de Atividade', desc: 'Commits, PRs e issues dos repositórios que você segue ou é colaborador' },
              { label: 'Meus Repositórios', desc: 'Lista de repos próprios e com acesso, ordenados por última atualização' },
              { label: 'Notificações', desc: 'Alertas de menções, reviews solicitados, PRs e issues atribuídos a você' },
              { label: 'Organizações', desc: 'Orgs das quais você é membro, com acesso rápido aos repositórios da org' },
            ].map((item) => (
              <div key={item.label} className="flex gap-3 p-3 rounded-xl border border-border bg-surface">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tokens de API */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Gerar Token de Acesso (API)</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Para usar a API REST ou autenticar ferramentas de CI/CD, gere um Personal Access Token em <strong className="text-text-primary">Configurações → Tokens de Acesso</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: 'Leitura', desc: 'Listar e visualizar dados. Ideal para dashboards externos.', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
              { name: 'Escrita', desc: 'Criar e atualizar recursos (repos, issues, PRs).', color: 'text-amber-600 bg-amber-50 border-amber-200' },
              { name: 'Admin', desc: 'Acesso completo incluindo configurações e exclusão.', color: 'text-red-600 bg-red-50 border-red-200' },
            ].map((t) => (
              <div key={t.name} className={`p-3 rounded-xl border ${t.color}`}>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs mt-1 opacity-80">{t.desc}</p>
              </div>
            ))}
          </div>
          <TipBox>
            Guarde o token imediatamente após gerado — ele só é exibido uma vez. Se perder o acesso, revogue e gere um novo.
          </TipBox>
        </CardContent>
      </Card>
    </div>
  );
}
