import { Terminal, GitBranch, GitCommit, GitMerge, GitPullRequest, RotateCcw, Info, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TabbedCodeBlock } from '../components/shared';

/* ── Local helpers ─────────────────────────────────────────── */
function TipBox({ variant = 'info', children }: { variant?: 'info' | 'warn'; children: React.ReactNode }) {
  if (variant === 'warn') {
    return (
      <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">{children}</p>
      </div>
    );
  }
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
      <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
      <p className="text-sm text-blue-700">{children}</p>
    </div>
  );
}

function CommandRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-border last:border-0">
      <code className="shrink-0 text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded font-mono">{cmd}</code>
      <p className="text-sm text-text-secondary">{desc}</p>
    </div>
  );
}

/* ── Section ────────────────────────────────────────────────── */
export default function GitCommandsSection() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <Terminal className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Comandos Git Essenciais</h2>
          <p className="text-sm text-text-secondary">Referência rápida dos comandos Git utilizados no dia a dia com o SpectraGit</p>
        </div>
      </div>

      {/* Card 1 — Configuração inicial */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Configuração Inicial</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Execute estes comandos uma única vez para configurar sua identidade no Git local.
          </p>
          <TabbedCodeBlock
            unix={`git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Linux/macOS: preservar finais de linha LF nos commits
git config --global core.autocrlf input

# Ver configuração atual
git config --global --list

# Arquivo de configuração: ~/.gitconfig`}
            windows={`git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Windows: converter finais de linha CRLF -> LF ao commitar
git config --global core.autocrlf true

# Ver configuração atual
git config --global --list

# Arquivo de configuração: C:\\Users\\<usuario>\\.gitconfig`}
          />
          <TipBox>
            O nome e e-mail definidos aqui aparecem em todos os commits que você fizer. Use o mesmo e-mail
            cadastrado na sua conta SpectraGit.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 2 — Clonar e inicializar */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Clonar e Inicializar Repositórios</h3>
          </div>
          <div className="space-y-0">
            <CommandRow cmd="git clone <url>"             desc="Copia um repositório remoto para sua máquina local. Use a URL SSH ou HTTPS do SpectraGit." />
            <CommandRow cmd="git clone <url> <pasta>"     desc="Clona o repositório em uma pasta com nome personalizado." />
            <CommandRow cmd="git init"                    desc="Inicializa um novo repositório Git na pasta atual. Use para projetos já existentes localmente." />
            <CommandRow cmd="git remote add origin <url>" desc="Vincula um repositório local a um remoto no SpectraGit." />
            <CommandRow cmd="git remote -v"               desc="Lista os repositórios remotos configurados e suas URLs." />
          </div>
          <TabbedCodeBlock
            unix={`# Clonar via SSH (recomendado)
git clone git@spectragit.local:usuario/meu-repo.git

# Clonar via HTTPS
git clone https://spectragit.local/usuario/meu-repo.git

# Vincular projeto existente ao SpectraGit
cd meu-projeto
git init
git remote add origin git@spectragit.local:usuario/meu-repo.git

# Ver chave SSH pública (adicione em Configurações → Chaves SSH)
cat ~/.ssh/id_ed25519.pub`}
            windows={`# Clonar via SSH (recomendado)
git clone git@spectragit.local:usuario/meu-repo.git

# Clonar via HTTPS
git clone https://spectragit.local/usuario/meu-repo.git

# Vincular projeto existente ao SpectraGit
cd meu-projeto
git init
git remote add origin git@spectragit.local:usuario/meu-repo.git

# Ver chave SSH pública (adicione em Configurações → Chaves SSH)
Get-Content "$env:USERPROFILE\\.ssh\\id_ed25519.pub"`}
          />
        </CardContent>
      </Card>

      {/* Card 3 — Fluxo básico de trabalho */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Fluxo Básico: Modificar e Commitar</h3>
          </div>
          <p className="text-sm text-text-secondary">
            O ciclo fundamental do Git: verificar status → adicionar ao stage → commitar → enviar.
          </p>
          <div className="space-y-0">
            <CommandRow cmd="git status"             desc="Mostra os arquivos modificados, novos ou deletados desde o último commit." />
            <CommandRow cmd="git add <arquivo>"      desc="Adiciona um arquivo específico ao stage (área de preparação para o commit)." />
            <CommandRow cmd="git add ."              desc="Adiciona todos os arquivos modificados ao stage de uma vez." />
            <CommandRow cmd="git add -p"             desc="Modo interativo: seleciona partes específicas de arquivos para adicionar ao stage." />
            <CommandRow cmd="git commit -m '<msg>'"  desc="Cria um commit com os arquivos em stage. A mensagem deve descrever a mudança." />
            <CommandRow cmd="git commit --amend"     desc="Edita o último commit (mensagem ou arquivos). Evite usar após push." />
            <CommandRow cmd="git push origin <branch>" desc="Envia os commits locais para o repositório remoto no SpectraGit." />
            <CommandRow cmd="git pull"               desc="Busca e integra as mudanças remotas na branch atual." />
          </div>
          <TabbedCodeBlock
            unix={`# Ciclo completo de trabalho
git status                          # ver o que mudou
git add .                           # preparar tudo
git commit -m "feat: adiciona login com OAuth"
git push origin main                # enviar para o SpectraGit`}
            windows={`# Ciclo completo de trabalho
git status                          # ver o que mudou
git add .                           # preparar tudo
git commit -m "feat: adiciona login com OAuth"
git push origin main                # enviar para o SpectraGit`}
          />
          <TipBox>
            <strong>Convenção de mensagens:</strong> Use prefixos como <code className="bg-blue-100 px-1 rounded">feat:</code>,{' '}
            <code className="bg-blue-100 px-1 rounded">fix:</code>, <code className="bg-blue-100 px-1 rounded">docs:</code>,{' '}
            <code className="bg-blue-100 px-1 rounded">refactor:</code> para manter o histórico organizado (Conventional Commits).
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 4 — Branches */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Branches</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Branches isolam o desenvolvimento de features ou correções sem afetar a branch principal.
          </p>
          <div className="space-y-0">
            <CommandRow cmd="git branch"                   desc="Lista todas as branches locais. A branch atual aparece marcada com *." />
            <CommandRow cmd="git branch -a"                desc="Lista branches locais e remotas." />
            <CommandRow cmd="git branch <nome>"            desc="Cria uma nova branch a partir da posição atual, mas não muda para ela." />
            <CommandRow cmd="git switch <nome>"            desc="Muda para uma branch existente (equivalente moderno de git checkout)." />
            <CommandRow cmd="git switch -c <nome>"         desc="Cria uma branch e já muda para ela (atalho para branch + switch)." />
            <CommandRow cmd="git push -u origin <nome>"    desc="Publica a branch local no remoto e define o tracking." />
            <CommandRow cmd="git branch -d <nome>"         desc="Deleta a branch local (somente se já foi mergeada)." />
            <CommandRow cmd="git push origin --delete <nome>" desc="Remove a branch do repositório remoto no SpectraGit." />
          </div>
          <TabbedCodeBlock
            unix={`# Fluxo típico de feature branch
git switch main                     # partir da branch principal
git pull                            # garantir que está atualizado
git switch -c feat/minha-feature    # criar e entrar na nova branch

# ... trabalhe e faça commits ...

git push -u origin feat/minha-feature  # publicar no SpectraGit
# agora abra o Pull Request pela interface`}
            windows={`# Fluxo típico de feature branch
git switch main                     # partir da branch principal
git pull                            # garantir que está atualizado
git switch -c feat/minha-feature    # criar e entrar na nova branch

# ... trabalhe e faça commits ...

git push -u origin feat/minha-feature  # publicar no SpectraGit
# agora abra o Pull Request pela interface`}
          />
        </CardContent>
      </Card>

      {/* Card 5 — Sincronizar com o remoto */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Sincronizar com o Repositório Remoto</h3>
          </div>
          <div className="space-y-0">
            <CommandRow cmd="git fetch"               desc="Baixa as atualizações remotas sem integrar na branch local. Seguro para inspecionar antes de aplicar." />
            <CommandRow cmd="git fetch --prune"       desc="Remove referências locais de branches remotas que já foram deletadas." />
            <CommandRow cmd="git pull"                desc="Equivalente a fetch + merge. Integra as mudanças remotas na branch atual." />
            <CommandRow cmd="git pull --rebase"       desc="Equivalente a fetch + rebase. Mantém histórico linear ao sincronizar." />
            <CommandRow cmd="git push"                desc="Envia os commits locais para o remoto na branch com tracking configurado." />
            <CommandRow cmd="git push --force-with-lease" desc="Force push seguro: falha se o remoto tiver commits que você não baixou." />
          </div>
          <TipBox variant="warn">
            Evite <code className="bg-amber-100 px-1 rounded">git push --force</code> em branches compartilhadas. Use
            sempre <code className="bg-amber-100 px-1 rounded">--force-with-lease</code> se precisar reescrever histórico.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 6 — Merge e Rebase */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Merge e Rebase</h3>
          </div>
          <div className="space-y-0">
            <CommandRow cmd="git merge <branch>"      desc="Integra os commits de outra branch na branch atual criando um commit de merge." />
            <CommandRow cmd="git merge --no-ff <branch>" desc="Força criação de commit de merge mesmo quando fast-forward seria possível." />
            <CommandRow cmd="git merge --squash <branch>" desc="Combina todos os commits da branch em um único antes de commitar." />
            <CommandRow cmd="git rebase <branch>"     desc="Reaplica os commits da branch atual sobre outra, criando histórico linear." />
            <CommandRow cmd="git rebase -i HEAD~<n>"  desc="Rebase interativo: reorganize, edite ou junte os últimos N commits." />
            <CommandRow cmd="git rebase --continue"   desc="Continua o rebase após resolver conflitos." />
            <CommandRow cmd="git rebase --abort"      desc="Cancela o rebase e volta ao estado anterior." />
          </div>
          <TabbedCodeBlock
            unix={`# Atualizar feature branch com main via rebase (histórico limpo)
git switch feat/minha-feature
git fetch origin
git rebase origin/main

# Se houver conflitos: resolve os arquivos, depois
git add .
git rebase --continue

# Enviar com force-with-lease (necessário após rebase)
git push --force-with-lease`}
            windows={`# Atualizar feature branch com main via rebase (histórico limpo)
git switch feat/minha-feature
git fetch origin
git rebase origin/main

# Se houver conflitos: resolve os arquivos, depois
git add .
git rebase --continue

# Enviar com force-with-lease (necessário após rebase)
git push --force-with-lease`}
          />
        </CardContent>
      </Card>

      {/* Card 7 — Inspecionar histórico */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Inspecionar Histórico e Diferenças</h3>
          </div>
          <div className="space-y-0">
            <CommandRow cmd="git log"                       desc="Exibe o histórico de commits em ordem cronológica reversa." />
            <CommandRow cmd="git log --oneline --graph"     desc="Histórico compacto com visualização gráfica das branches." />
            <CommandRow cmd="git log -p <arquivo>"          desc="Mostra as alterações de cada commit em um arquivo específico." />
            <CommandRow cmd="git diff"                      desc="Mostra as mudanças ainda não adicionadas ao stage." />
            <CommandRow cmd="git diff --staged"             desc="Mostra as mudanças já em stage que serão incluídas no próximo commit." />
            <CommandRow cmd="git diff <branch1>..<branch2>" desc="Compara as diferenças entre duas branches." />
            <CommandRow cmd="git show <commit>"             desc="Exibe os detalhes e mudanças de um commit específico pelo hash." />
            <CommandRow cmd="git blame <arquivo>"           desc="Mostra quem modificou cada linha de um arquivo e em qual commit." />
          </div>
          <TabbedCodeBlock
            unix={`# Visualizar histórico compacto com grafo de branches
git log --oneline --graph --all --decorate

# Comparar sua branch com main antes de abrir PR
git diff main...HEAD`}
            windows={`# Visualizar histórico compacto com grafo de branches
git log --oneline --graph --all --decorate

# Comparar sua branch com main antes de abrir PR
git diff main...HEAD`}
          />
        </CardContent>
      </Card>

      {/* Card 8 — Desfazer e recuperar */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Desfazer e Recuperar</h3>
          </div>
          <div className="space-y-0">
            <CommandRow cmd="git restore <arquivo>"         desc="Descarta as mudanças não salvas em um arquivo, voltando ao estado do último commit." />
            <CommandRow cmd="git restore --staged <arquivo>" desc="Remove um arquivo do stage sem descartar as mudanças no disco." />
            <CommandRow cmd="git revert <commit>"           desc="Cria um novo commit que desfaz as mudanças de um commit específico. Seguro para branches compartilhadas." />
            <CommandRow cmd="git reset --soft HEAD~1"       desc="Desfaz o último commit mantendo as mudanças em stage. Bom para reformular a mensagem." />
            <CommandRow cmd="git reset --mixed HEAD~1"      desc="Desfaz o último commit mantendo as mudanças no disco mas fora do stage." />
            <CommandRow cmd="git reset --hard HEAD~1"       desc="Desfaz o último commit e descarta todas as mudanças. Irreversível." />
            <CommandRow cmd="git stash"                     desc="Guarda temporariamente as mudanças não commitadas para limpar o working tree." />
            <CommandRow cmd="git stash pop"                 desc="Restaura as mudanças guardadas com stash e remove da pilha." />
            <CommandRow cmd="git stash list"                desc="Lista todos os stashes guardados." />
          </div>
          <TipBox variant="warn">
            <strong>git reset --hard</strong> descarta mudanças permanentemente. Prefira <code className="bg-amber-100 px-1 rounded">git revert</code> em
            branches já publicadas, pois ele não reescreve o histórico.
          </TipBox>
          <TabbedCodeBlock
            unix={`# Guardar trabalho em andamento para trocar de branch
git stash
git switch outra-branch
# ... faz o que precisava ...
git switch feat/minha-feature
git stash pop               # restaura as mudanças

# Desfazer um commit público de forma segura
git revert abc1234
git push`}
            windows={`# Guardar trabalho em andamento para trocar de branch
git stash
git switch outra-branch
# ... faz o que precisava ...
git switch feat/minha-feature
git stash pop               # restaura as mudanças

# Desfazer um commit público de forma segura
git revert abc1234
git push`}
          />
        </CardContent>
      </Card>

      {/* Card 9 — Tags */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Tags e Releases</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Tags marcam pontos específicos do histórico — geralmente versões de lançamento.
          </p>
          <div className="space-y-0">
            <CommandRow cmd="git tag"                       desc="Lista todas as tags do repositório." />
            <CommandRow cmd="git tag <v1.0.0>"              desc="Cria uma tag leve no commit atual." />
            <CommandRow cmd="git tag -a <v1.0.0> -m '<msg>'" desc="Cria uma tag anotada com descrição — recomendada para releases." />
            <CommandRow cmd="git push origin <v1.0.0>"      desc="Publica uma tag específica no SpectraGit." />
            <CommandRow cmd="git push origin --tags"        desc="Publica todas as tags locais de uma vez." />
            <CommandRow cmd="git tag -d <v1.0.0>"           desc="Remove uma tag local." />
            <CommandRow cmd="git push origin --delete <v1.0.0>" desc="Remove uma tag do repositório remoto." />
          </div>
          <TabbedCodeBlock
            unix={`# Criar e publicar uma release
git switch main
git pull
git tag -a v1.2.0 -m "Release v1.2.0 — adiciona autenticação OAuth"
git push origin v1.2.0
# Agora crie a Release pela interface do SpectraGit em Releases → New`}
            windows={`# Criar e publicar uma release
git switch main
git pull
git tag -a v1.2.0 -m "Release v1.2.0 — adiciona autenticação OAuth"
git push origin v1.2.0
# Agora crie a Release pela interface do SpectraGit em Releases → New`}
          />
          <TipBox>
            Após publicar uma tag no SpectraGit, vá em <strong>Releases → New Release</strong>, selecione a
            tag criada e adicione as notas de lançamento.
          </TipBox>
        </CardContent>
      </Card>

      {/* Card 10 — .gitignore */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Ignorar Arquivos com .gitignore</h3>
          </div>
          <p className="text-sm text-text-secondary">
            O arquivo <code className="bg-primary-50 text-primary-700 px-1 rounded">.gitignore</code> na
            raiz do repositório define quais arquivos e pastas o Git deve ignorar.
          </p>
          <TabbedCodeBlock
            unixLang="gitignore"
            windowsLang="gitignore"
            unix={`# Dependências
node_modules/
vendor/

# Build e dist
dist/
build/
*.pyc

# Variáveis de ambiente e segredos
.env
.env.local
*.key
*.pem

# Logs
*.log
logs/

# macOS
.DS_Store
.Spotlight-V100
.Trashes

# Editor
.vscode/
.idea/
*.swp`}
            windows={`# Dependências
node_modules/
vendor/

# Build e dist
dist/
build/
*.pyc

# Variáveis de ambiente e segredos
.env
.env.local
*.key
*.pem

# Logs
*.log
logs/

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/

# Editor
.vscode/
.idea/
*.swp`}
          />
          <TabbedCodeBlock
            unix={`# Criar .gitignore na raiz do projeto (se não existir)
touch .gitignore

# Verificar qual regra está ignorando um arquivo
git check-ignore -v node_modules/`}
            windows={`# Criar .gitignore na raiz do projeto (se não existir)
New-Item -ItemType File .gitignore

# Verificar qual regra está ignorando um arquivo
git check-ignore -v node_modules/`}
          />
          <div className="space-y-0 mt-2">
            <CommandRow cmd="git rm --cached <arquivo>" desc="Remove um arquivo do rastreamento do Git sem deletá-lo do disco. Use quando já commitou algo que deveria estar no .gitignore." />
            <CommandRow cmd="git check-ignore -v <arquivo>" desc="Mostra qual regra do .gitignore está ignorando um arquivo." />
          </div>
          <TipBox>
            O SpectraGit oferece templates de <code className="bg-blue-100 px-1 rounded">.gitignore</code> por
            linguagem ao criar um novo repositório. Selecione o template adequado para não precisar criar do zero.
          </TipBox>
        </CardContent>
      </Card>
    </div>
  );
}
