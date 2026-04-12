import { Code2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WorkflowDiagram } from '../components/diagrams';
import { CodeTabs } from '@/components/animate-ui/components/animate/code-tabs';

const JS_CODE = `const BASE_URL = 'https://your-instance.com/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIs...';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': \`Bearer \${TOKEN}\`,
};

// 1. Criar repositório
const createRes = await fetch(\`\${BASE_URL}/repos\`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: 'my-awesome-project',
    description: 'Um projeto incrível criado via API',
    visibility: 'PUBLIC',
    defaultBranch: 'main',
    initWithReadme: true,
  }),
});
const { data: repo } = await createRes.json();
console.log('Repo criado:', repo.name);

// 2. Listar branches
const branchRes = await fetch(
  \`\${BASE_URL}/repos/\${repo.owner.username}/\${repo.slug}/branches\`,
  { headers }
);
const { data: branches } = await branchRes.json();
console.log('Branches:', branches.map(b => b.name));

// 3. Criar uma issue
const issueRes = await fetch(
  \`\${BASE_URL}/repos/\${repo.owner.username}/\${repo.slug}/issues\`,
  {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Primeira issue via API',
      body: 'Testando criação de issues pela API!',
    }),
  }
);
const { data: issue } = await issueRes.json();
console.log('Issue #' + issue.number, 'criada!');`;

const PYTHON_CODE = `import requests

BASE_URL = "https://your-instance.com/api/v1"
TOKEN = "eyJhbGciOiJIUzI1NiIs..."
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

# 1. Listar meus repositórios
repos = requests.get(
    f"{BASE_URL}/repos",
    params={"scope": "mine", "page": 1, "limit": 10},
    headers=headers,
).json()["data"]

for repo in repos["items"]:
    print(f"  {repo['owner']['username']}/{repo['name']} - {repo['visibility']}")

# 2. Criar um pull request
owner = "johndoe"
repo_name = "my-awesome-project"

pr = requests.post(
    f"{BASE_URL}/repos/{owner}/{repo_name}/pulls",
    headers=headers,
    json={
        "title": "feat: add dark mode support",
        "body": "Implementação do modo escuro\\n\\n- Tema dark\\n- Toggle automático",
        "sourceBranch": "feature/dark-mode",
        "targetBranch": "main",
    },
).json()["data"]

print(f"PR #{pr['number']} criado: {pr['title']}")

# 3. Aprovar o PR com review
review = requests.post(
    f"{BASE_URL}/repos/{owner}/{repo_name}/pulls/{pr['number']}/reviews",
    headers=headers,
    json={
        "status": "APPROVED",
        "body": "LGTM! Ótima implementação.",
    },
).json()["data"]

print(f"Review {review['status']} submetida!")`;

const CURL_CODE = `# Variáveis
BASE="https://your-instance.com/api/v1"
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Obter perfil do usuário logado
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/me" | jq .data

# Criar repositório
curl -s -X POST "$BASE/repos" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "api-test",
    "description": "Criado via cURL",
    "visibility": "PRIVATE"
  }' | jq .data

# Listar issues abertas
curl -s "$BASE/repos/johndoe/my-repo/issues?status=OPEN&limit=5" \\
  -H "Authorization: Bearer $TOKEN" | jq '.data.items[] | {number, title}'

# Fazer fork de um repositório
curl -s -X POST "$BASE/repos/otheruser/cool-project/fork" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "my-fork"}' | jq .data

# Importar repositório do GitHub
curl -s -X POST "$BASE/integrations/github/repos/octocat/Hello-World/import" \\
  -H "Authorization: Bearer $TOKEN" | jq .data

# Upload de avatar
curl -s -X POST "$BASE/me/avatar" \\
  -H "Authorization: Bearer $TOKEN" \\
  -F "file=@avatar.png" | jq .data`;

export default function ExamplesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <Code2 className="h-5 w-5 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Exemplos de Uso</h2>
      </div>

      <CodeTabs
        codes={{
          JavaScript: JS_CODE,
          Python: PYTHON_CODE,
          cURL: CURL_CODE,
        }}
        lang="javascript"
        theme="github-dark"
        className="border-border bg-[#1a1b26] text-[#a9b1d6]"
      />

      {/* Workflow completo */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Workflow</Badge>
            <span className="text-sm font-medium text-text-primary">Fluxo completo: Criar repo → Branch → PR → Merge</span>
          </div>
          <WorkflowDiagram />
        </CardContent>
      </Card>
    </div>
  );
}


