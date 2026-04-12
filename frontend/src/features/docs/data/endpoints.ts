import type { Endpoint } from '../types';

export const SETUP_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: '/api/v1/setup/status', description: 'Verifica se a instância já foi inicializada', auth: false,
    response: `{ "data": { "initialized": false }, "meta": {...} }`,
  },
  {
    method: 'GET', path: '/api/v1/setup/branding', description: 'Retorna branding público (nome, logo, cor primária)', auth: false,
    response: `{ "data": { "appName": "SpectraGit", "appLogoUrl": null, "primaryColor": "#7c3aed" }, "meta": {...} }`,
  },
  {
    method: 'POST', path: '/api/v1/setup/initialize', description: 'Realiza setup inicial da instância (primeira vez apenas)', auth: false,
    body: [
      { name: 'appName', type: 'string', required: true, description: 'Nome da instância (max 100 chars)' },
      { name: 'baseUrl', type: 'string', required: true, description: 'URL base da aplicação' },
      { name: 'primaryColor', type: 'string', required: true, description: 'Cor primária em hex (#7c3aed)' },
      { name: 'adminUsername', type: 'string', required: true, description: 'Username do admin (3-39 chars, alfanumérico)' },
      { name: 'adminEmail', type: 'string', required: true, description: 'Email do administrador' },
      { name: 'adminPassword', type: 'string', required: true, description: 'Senha do admin (min 8, max 128 chars)' },
    ],
  },
];

export const AUTH_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/v1/auth/oauth/google', description: 'Inicia fluxo OAuth com Google (redireciona)', auth: false },
  { method: 'GET', path: '/api/v1/auth/oauth/google/callback', description: 'Callback do Google OAuth', auth: false },
  { method: 'GET', path: '/api/v1/auth/oauth/github', description: 'Inicia fluxo OAuth com GitHub (redireciona)', auth: false },
  { method: 'GET', path: '/api/v1/auth/oauth/github/callback', description: 'Callback do GitHub OAuth', auth: false },
  {
    method: 'POST', path: '/api/v1/auth/refresh', description: 'Renova tokens de acesso usando refresh token', auth: false,
    body: [{ name: 'refreshToken', type: 'string', required: true, description: 'Refresh token válido' }],
    response: `{ "data": { "accessToken": "eyJ...", "refreshToken": "novo-token", "expiresIn": "15m" } }`,
  },
  {
    method: 'POST', path: '/api/v1/auth/logout', description: 'Encerra a sessão atual', auth: true,
    body: [{ name: 'refreshToken', type: 'string', required: true, description: 'Refresh token da sessão' }],
  },
  { method: 'POST', path: '/api/v1/auth/logout/all', description: 'Encerra todas as sessões do usuário', auth: true },
  {
    method: 'GET', path: '/api/v1/auth/sessions', description: 'Lista todas as sessões ativas', auth: true,
    response: `{ "data": [{ "id": "uuid", "userAgent": "...", "ipAddress": "...", "lastUsedAt": "..." }] }`,
  },
  {
    method: 'DELETE', path: '/api/v1/auth/sessions/:id', description: 'Revoga uma sessão específica', auth: true,
    pathParams: [{ name: 'id', type: 'string (UUID)', required: true, description: 'ID da sessão' }],
  },
];

export const USERS_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: '/api/v1/me', description: 'Retorna o perfil do usuário autenticado', auth: true,
    response: `{
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "bio": "Full-stack developer",
    "avatarUrl": "https://...",
    "location": "São Paulo",
    "website": "https://johndoe.dev",
    "systemRole": "USER",
    "createdAt": "2026-04-11T..."
  }
}`,
  },
  {
    method: 'PUT', path: '/api/v1/me', description: 'Atualiza o perfil do usuário autenticado', auth: true,
    body: [
      { name: 'displayName', type: 'string', required: false, description: 'Nome de exibição (max 100)' },
      { name: 'bio', type: 'string', required: false, description: 'Biografia (max 500)' },
      { name: 'location', type: 'string', required: false, description: 'Localização (max 255)' },
      { name: 'website', type: 'string', required: false, description: 'URL do website (max 512)' },
    ],
  },
  { method: 'DELETE', path: '/api/v1/me', description: 'Exclui permanentemente a conta do usuário', auth: true },
  { method: 'GET', path: '/api/v1/me/oauth-accounts', description: 'Lista contas OAuth vinculadas', auth: true },
  {
    method: 'POST', path: '/api/v1/me/ssh-keys', description: 'Adiciona uma chave SSH', auth: true,
    body: [
      { name: 'title', type: 'string', required: true, description: 'Nome da chave (max 100)' },
      { name: 'publicKey', type: 'string', required: true, description: 'Chave pública SSH' },
    ],
  },
  { method: 'GET', path: '/api/v1/me/ssh-keys', description: 'Lista chaves SSH do usuário', auth: true },
  {
    method: 'DELETE', path: '/api/v1/me/ssh-keys/:id', description: 'Remove uma chave SSH', auth: true,
    pathParams: [{ name: 'id', type: 'string (UUID)', required: true, description: 'ID da chave SSH' }],
  },
  {
    method: 'POST', path: '/api/v1/me/avatar', description: 'Upload de avatar (multipart, max 5MB)', auth: true,
  },
  {
    method: 'GET', path: '/api/v1/avatars/:userId/:filename', description: 'Retorna imagem do avatar', auth: false,
    pathParams: [
      { name: 'userId', type: 'string', required: true, description: 'ID do usuário' },
      { name: 'filename', type: 'string', required: true, description: 'Nome do arquivo' },
    ],
  },
  {
    method: 'GET', path: '/api/v1/users/popular', description: 'Lista usuários populares', auth: false,
    queryParams: [
      { name: 'timeframe', type: 'string', required: false, description: 'week, month ou all', default: 'week' },
      { name: 'limit', type: 'number', required: false, description: 'Limite de resultados', default: '10' },
    ],
  },
  {
    method: 'GET', path: '/api/v1/users/:username', description: 'Retorna perfil público de um usuário', auth: false,
    pathParams: [{ name: 'username', type: 'string', required: true, description: 'Username do usuário' }],
  },
  {
    method: 'GET', path: '/api/v1/users/search', description: 'Busca usuários por nome/username', auth: true,
    queryParams: [
      { name: 'q', type: 'string', required: false, description: 'Texto de busca' },
      { name: 'limit', type: 'number', required: false, description: 'Limite de resultados' },
    ],
  },
];

export const REPO_ENDPOINTS: Endpoint[] = [
  {
    method: 'POST', path: '/api/v1/repos', description: 'Cria um novo repositório', auth: true,
    body: [
      { name: 'name', type: 'string', required: true, description: 'Nome do repositório (alfanumérico, ._-, max 100)' },
      { name: 'description', type: 'string', required: false, description: 'Descrição (max 500)' },
      { name: 'visibility', type: 'enum', required: false, description: 'PUBLIC ou PRIVATE', default: 'PUBLIC' },
      { name: 'defaultBranch', type: 'string', required: false, description: 'Branch padrão', default: 'main' },
      { name: 'initWithReadme', type: 'boolean', required: false, description: 'Inicializar com README', default: 'true' },
      { name: 'orgId', type: 'string', required: false, description: 'ID da organização (se repo org)' },
    ],
    response: `{
  "data": {
    "id": "uuid",
    "name": "my-project",
    "slug": "my-project",
    "description": "A cool project",
    "visibility": "PUBLIC",
    "defaultBranch": "main",
    "owner": { "id": "uuid", "username": "johndoe" },
    "createdAt": "2026-04-11T..."
  }
}`,
  },
  {
    method: 'GET', path: '/api/v1/repos', description: 'Lista repositórios (com filtros e paginação)', auth: false,
    queryParams: [
      { name: 'scope', type: 'string', required: false, description: '"mine" ou "all"' },
      { name: 'q', type: 'string', required: false, description: 'Filtro por texto' },
      { name: 'repoSort', type: 'string', required: false, description: 'updated, recent, trending, forks' },
      { name: 'page', type: 'number', required: false, description: 'Página', default: '1' },
      { name: 'limit', type: 'number', required: false, description: 'Itens por página', default: '20' },
    ],
  },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo', description: 'Detalhes de um repositório', auth: false,
    pathParams: [
      { name: 'owner', type: 'string', required: true, description: 'Username do dono ou nome da org' },
      { name: 'repo', type: 'string', required: true, description: 'Slug do repositório' },
    ],
  },
  {
    method: 'PUT', path: '/api/v1/repos/:owner/:repo', description: 'Atualiza configurações do repositório', auth: true,
    pathParams: [
      { name: 'owner', type: 'string', required: true, description: 'Username do dono' },
      { name: 'repo', type: 'string', required: true, description: 'Slug do repositório' },
    ],
    body: [
      { name: 'description', type: 'string', required: false, description: 'Descrição (max 500)' },
      { name: 'website', type: 'string', required: false, description: 'URL do website' },
      { name: 'topics', type: 'string[]', required: false, description: 'Tópicos (max 20)' },
      { name: 'visibility', type: 'enum', required: false, description: 'PUBLIC ou PRIVATE' },
      { name: 'defaultBranch', type: 'string', required: false, description: 'Branch padrão' },
      { name: 'hasIssuesEnabled', type: 'boolean', required: false, description: 'Habilitar issues' },
      { name: 'hasPRsEnabled', type: 'boolean', required: false, description: 'Habilitar pull requests' },
      { name: 'allowMergeCommit', type: 'boolean', required: false, description: 'Permitir merge commit' },
      { name: 'allowSquashMerge', type: 'boolean', required: false, description: 'Permitir squash merge' },
      { name: 'allowRebaseMerge', type: 'boolean', required: false, description: 'Permitir rebase merge' },
      { name: 'autoDeleteBranch', type: 'boolean', required: false, description: 'Auto-deletar branch após merge' },
      { name: 'isArchived', type: 'boolean', required: false, description: 'Arquivar repositório' },
    ],
  },
  {
    method: 'DELETE', path: '/api/v1/repos/:owner/:repo', description: 'Exclui um repositório permanentemente', auth: true,
    pathParams: [
      { name: 'owner', type: 'string', required: true, description: 'Username do dono' },
      { name: 'repo', type: 'string', required: true, description: 'Slug do repositório' },
    ],
  },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/fork', description: 'Cria um fork do repositório', auth: true,
    pathParams: [
      { name: 'owner', type: 'string', required: true, description: 'Dono do repositório original' },
      { name: 'repo', type: 'string', required: true, description: 'Slug do repositório' },
    ],
    body: [{ name: 'name', type: 'string', required: false, description: 'Nome customizado para o fork' }],
  },
  { method: 'POST', path: '/api/v1/repos/:owner/:repo/pulse', description: 'Adiciona estrela ao repositório', auth: true },
  { method: 'DELETE', path: '/api/v1/repos/:owner/:repo/pulse', description: 'Remove estrela do repositório', auth: true },
  { method: 'POST', path: '/api/v1/repos/:owner/:repo/watch', description: 'Começa a observar o repositório', auth: true },
  { method: 'DELETE', path: '/api/v1/repos/:owner/:repo/watch', description: 'Para de observar o repositório', auth: true },
  { method: 'GET', path: '/api/v1/repos/:owner/:repo/stats', description: 'Estatísticas (linguagens, contribuidores)', auth: false },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/tree/:branch', description: 'Árvore de arquivos', auth: false,
    pathParams: [
      { name: 'owner', type: 'string', required: true, description: 'Dono' },
      { name: 'repo', type: 'string', required: true, description: 'Repositório' },
      { name: 'branch', type: 'string', required: true, description: 'Branch ou ref' },
    ],
    queryParams: [{ name: 'path', type: 'string', required: false, description: 'Caminho do diretório' }],
  },
  { method: 'GET', path: '/api/v1/repos/:owner/:repo/blob/:branch/*', description: 'Conteúdo de um arquivo', auth: false },
  { method: 'GET', path: '/api/v1/repos/:owner/:repo/raw/:branch/*', description: 'Arquivo raw (binário)', auth: false },
  { method: 'GET', path: '/api/v1/repos/:owner/:repo/archive/:branchWithExt', description: 'Download de arquivo ZIP', auth: false },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/branches/:branch/protection', description: 'Regras de proteção de branch', auth: true,
  },
  {
    method: 'PUT', path: '/api/v1/repos/:owner/:repo/branches/:branch/protection', description: 'Atualiza proteção de branch', auth: true,
    body: [
      { name: 'requirePullRequest', type: 'boolean', required: false, description: 'Exigir PR para merge' },
      { name: 'requiredReviewCount', type: 'number', required: false, description: 'Número de reviews obrigatórias (0-10)' },
      { name: 'dismissStaleReviews', type: 'boolean', required: false, description: 'Dispensar reviews obsoletos' },
      { name: 'restrictPushes', type: 'boolean', required: false, description: 'Restringir pushes' },
      { name: 'allowForcePushes', type: 'boolean', required: false, description: 'Permitir force push' },
      { name: 'requireLinearHistory', type: 'boolean', required: false, description: 'Exigir histórico linear' },
    ],
  },
  { method: 'DELETE', path: '/api/v1/repos/:owner/:repo/branches/:branch/protection', description: 'Remove proteção de branch', auth: true },
  { method: 'GET', path: '/api/v1/repos/:owner/:repo/webhooks', description: 'Lista webhooks', auth: true },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/webhooks', description: 'Cria webhook', auth: true,
    body: [
      { name: 'url', type: 'string', required: true, description: 'URL do webhook (max 2048)' },
      { name: 'secret', type: 'string', required: false, description: 'Secret para assinatura' },
      { name: 'events', type: 'string[]', required: false, description: 'Eventos (push, etc)', default: '["push"]' },
      { name: 'isActive', type: 'boolean', required: false, description: 'Ativo', default: 'true' },
    ],
  },
  { method: 'PUT', path: '/api/v1/repos/:owner/:repo/webhooks/:webhookId', description: 'Atualiza webhook', auth: true },
  { method: 'DELETE', path: '/api/v1/repos/:owner/:repo/webhooks/:webhookId', description: 'Remove webhook', auth: true },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/transfer', description: 'Transfere repositório para outro usuário', auth: true,
    body: [
      { name: 'newOwner', type: 'string', required: true, description: 'Username do novo dono' },
      { name: 'newName', type: 'string', required: false, description: 'Novo nome (opcional)' },
    ],
  },
];

export const BRANCH_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/branches', description: 'Lista todas as branches do repositório', auth: false,
    pathParams: [
      { name: 'owner', type: 'string', required: true, description: 'Dono do repositório' },
      { name: 'repo', type: 'string', required: true, description: 'Slug do repositório' },
    ],
    response: `{ "data": [{ "name": "main", "headCommitSha": "abc123...", "isProtected": false }] }`,
  },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/branches', description: 'Cria uma nova branch', auth: true,
    body: [
      { name: 'name', type: 'string', required: true, description: 'Nome da branch (max 255)' },
      { name: 'startPoint', type: 'string', required: true, description: 'Branch ou SHA de origem' },
    ],
  },
  {
    method: 'DELETE', path: '/api/v1/repos/:owner/:repo/branches/:branch', description: 'Deleta uma branch', auth: true,
    pathParams: [
      { name: 'owner', type: 'string', required: true, description: 'Dono' },
      { name: 'repo', type: 'string', required: true, description: 'Repositório' },
      { name: 'branch', type: 'string', required: true, description: 'Nome da branch' },
    ],
  },
];

export const COMMIT_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/commits', description: 'Lista commits da branch', auth: false,
    queryParams: [
      { name: 'branch', type: 'string', required: false, description: 'Branch', default: 'main' },
      { name: 'limit', type: 'number', required: false, description: 'Limite', default: '30' },
      { name: 'offset', type: 'number', required: false, description: 'Offset', default: '0' },
    ],
    response: `{
  "data": [{
    "sha": "abc123...",
    "message": "fix: resolve login issue",
    "author": { "name": "John", "email": "john@example.com" },
    "date": "2026-04-11T..."
  }]
}`,
  },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/commits/:sha', description: 'Detalhes de um commit', auth: false,
    pathParams: [{ name: 'sha', type: 'string', required: true, description: 'SHA do commit' }],
  },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/commits/:sha/diff', description: 'Diff do commit', auth: false,
    pathParams: [{ name: 'sha', type: 'string', required: true, description: 'SHA do commit' }],
  },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/compare/:base...:head', description: 'Compara duas refs (branches ou commits)', auth: false,
    pathParams: [
      { name: 'base', type: 'string', required: true, description: 'Ref base' },
      { name: 'head', type: 'string', required: true, description: 'Ref head' },
    ],
  },
];

export const ISSUE_ENDPOINTS: Endpoint[] = [
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/issues', description: 'Cria uma nova issue', auth: true,
    body: [
      { name: 'title', type: 'string', required: true, description: 'Título da issue (max 255)' },
      { name: 'body', type: 'string', required: false, description: 'Corpo em markdown' },
      { name: 'assigneeId', type: 'string (UUID)', required: false, description: 'ID do assignee' },
      { name: 'labelIds', type: 'string[]', required: false, description: 'IDs de labels' },
      { name: 'milestoneId', type: 'string (UUID)', required: false, description: 'ID do milestone' },
    ],
  },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/issues', description: 'Lista issues (paginadas, filtráveis)', auth: false,
    queryParams: [
      { name: 'status', type: 'enum', required: false, description: 'OPEN ou CLOSED' },
      { name: 'sort', type: 'string', required: false, description: 'Campo para ordenar' },
      { name: 'sortOrder', type: 'string', required: false, description: 'asc ou desc' },
      { name: 'search', type: 'string', required: false, description: 'Texto para busca' },
      { name: 'page', type: 'number', required: false, description: 'Página', default: '1' },
      { name: 'limit', type: 'number', required: false, description: 'Itens por página', default: '20' },
    ],
  },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/issues/:number', description: 'Detalhes de uma issue', auth: false,
    pathParams: [{ name: 'number', type: 'number', required: true, description: 'Número da issue' }],
  },
  {
    method: 'PUT', path: '/api/v1/repos/:owner/:repo/issues/:number', description: 'Atualiza uma issue', auth: true,
    body: [
      { name: 'title', type: 'string', required: false, description: 'Novo título' },
      { name: 'body', type: 'string', required: false, description: 'Novo corpo' },
      { name: 'status', type: 'enum', required: false, description: 'OPEN ou CLOSED' },
      { name: 'assigneeId', type: 'string', required: false, description: 'ID do assignee' },
      { name: 'labelIds', type: 'string[]', required: false, description: 'IDs de labels' },
    ],
  },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/issues/:number/comments', description: 'Adiciona comentário na issue', auth: true,
    body: [{ name: 'body', type: 'string', required: false, description: 'Texto do comentário' }],
  },
];

export const PR_ENDPOINTS: Endpoint[] = [
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/pulls', description: 'Cria um pull request', auth: true,
    body: [
      { name: 'title', type: 'string', required: true, description: 'Título do PR (max 255)' },
      { name: 'body', type: 'string', required: false, description: 'Descrição em markdown' },
      { name: 'sourceBranch', type: 'string', required: true, description: 'Branch de origem' },
      { name: 'targetBranch', type: 'string', required: true, description: 'Branch de destino' },
    ],
  },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/pulls', description: 'Lista pull requests (paginados, filtráveis)', auth: false,
    queryParams: [
      { name: 'status', type: 'enum', required: false, description: 'OPEN, CLOSED ou MERGED' },
      { name: 'sort', type: 'string', required: false, description: 'Campo para ordenar' },
      { name: 'sortOrder', type: 'string', required: false, description: 'asc ou desc' },
      { name: 'search', type: 'string', required: false, description: 'Texto para busca' },
      { name: 'page', type: 'number', required: false, description: 'Página', default: '1' },
      { name: 'limit', type: 'number', required: false, description: 'Itens por página', default: '20' },
    ],
  },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/pulls/:number', description: 'Detalhes de um pull request', auth: false,
    pathParams: [{ name: 'number', type: 'number', required: true, description: 'Número do PR' }],
  },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/pulls/:number/diff', description: 'Diff do pull request', auth: false,
  },
  {
    method: 'PUT', path: '/api/v1/repos/:owner/:repo/pulls/:number', description: 'Atualiza título/descrição do PR', auth: true,
    body: [
      { name: 'title', type: 'string', required: false, description: 'Novo título' },
      { name: 'body', type: 'string', required: false, description: 'Nova descrição' },
    ],
  },
  { method: 'POST', path: '/api/v1/repos/:owner/:repo/pulls/:number/close', description: 'Fecha um pull request', auth: true },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/pulls/:number/merge', description: 'Faz merge do pull request', auth: true,
    body: [{ name: 'strategy', type: 'enum', required: false, description: 'MERGE_COMMIT, SQUASH ou REBASE', default: 'MERGE_COMMIT' }],
  },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/pulls/:number/comments', description: 'Adiciona comentário no PR', auth: true,
    body: [{ name: 'body', type: 'string', required: true, description: 'Texto do comentário' }],
  },
];

export const REVIEW_ENDPOINTS: Endpoint[] = [
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/pulls/:number/reviews', description: 'Submete uma review', auth: true,
    body: [
      { name: 'status', type: 'enum', required: true, description: 'APPROVED, CHANGES_REQUESTED ou COMMENTED' },
      { name: 'body', type: 'string', required: false, description: 'Comentário geral da review' },
    ],
  },
  { method: 'GET', path: '/api/v1/repos/:owner/:repo/pulls/:number/reviews', description: 'Lista reviews do PR', auth: false },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/pulls/:number/reviews/:reviewId/comments', description: 'Adiciona comentário inline', auth: true,
    body: [
      { name: 'body', type: 'string', required: true, description: 'Texto do comentário' },
      { name: 'filePath', type: 'string', required: true, description: 'Caminho do arquivo' },
      { name: 'lineNumber', type: 'number', required: true, description: 'Número da linha' },
    ],
  },
];

export const TAG_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/v1/repos/:owner/:repo/tags', description: 'Lista todas as tags', auth: false },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/tags/:tag', description: 'Detalhes de uma tag', auth: false,
    pathParams: [{ name: 'tag', type: 'string', required: true, description: 'Nome da tag' }],
  },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/tags', description: 'Cria uma nova tag', auth: true,
    body: [
      { name: 'name', type: 'string', required: true, description: 'Nome da tag (max 255)' },
      { name: 'commitSha', type: 'string', required: true, description: 'SHA do commit (40 chars)' },
      { name: 'message', type: 'string', required: false, description: 'Mensagem da tag anotada' },
    ],
  },
  {
    method: 'DELETE', path: '/api/v1/repos/:owner/:repo/tags/:tag', description: 'Remove uma tag', auth: true,
    pathParams: [{ name: 'tag', type: 'string', required: true, description: 'Nome da tag' }],
  },
];

export const RELEASE_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/v1/repos/:owner/:repo/releases', description: 'Lista releases', auth: false },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/releases/:releaseId', description: 'Detalhes de uma release', auth: false,
    pathParams: [{ name: 'releaseId', type: 'string (UUID)', required: true, description: 'ID da release' }],
  },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/releases', description: 'Cria uma release', auth: true,
    body: [
      { name: 'tagName', type: 'string', required: true, description: 'Nome da tag (max 255)' },
      { name: 'name', type: 'string', required: true, description: 'Título da release' },
      { name: 'body', type: 'string', required: false, description: 'Notas da release (markdown)' },
      { name: 'isDraft', type: 'boolean', required: false, description: 'Rascunho' },
      { name: 'isPrerelease', type: 'boolean', required: false, description: 'Pré-release' },
      { name: 'targetBranch', type: 'string', required: false, description: 'Branch alvo' },
      { name: 'commitSha', type: 'string', required: false, description: 'SHA do commit' },
      { name: 'tagMessage', type: 'string', required: false, description: 'Mensagem da tag anotada' },
    ],
  },
  {
    method: 'PUT', path: '/api/v1/repos/:owner/:repo/releases/:releaseId', description: 'Atualiza uma release', auth: true,
    body: [
      { name: 'name', type: 'string', required: false, description: 'Novo título' },
      { name: 'body', type: 'string', required: false, description: 'Novas notas' },
      { name: 'isDraft', type: 'boolean', required: false, description: 'Rascunho' },
      { name: 'isPrerelease', type: 'boolean', required: false, description: 'Pré-release' },
    ],
  },
  { method: 'DELETE', path: '/api/v1/repos/:owner/:repo/releases/:releaseId', description: 'Exclui uma release', auth: true },
  { method: 'POST', path: '/api/v1/repos/:owner/:repo/releases/:releaseId/assets', description: 'Upload de assets (max 10 arquivos, 100MB cada)', auth: true },
  { method: 'GET', path: '/api/v1/repos/:owner/:repo/releases/:releaseId/assets/:assetId/download', description: 'Download de um asset', auth: false },
  { method: 'DELETE', path: '/api/v1/repos/:owner/:repo/releases/:releaseId/assets/:assetId', description: 'Remove um asset', auth: true },
];

export const NOTIFICATION_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: '/api/v1/notifications', description: 'Lista notificações (paginadas)', auth: true,
    queryParams: [
      { name: 'page', type: 'number', required: false, description: 'Página', default: '1' },
      { name: 'limit', type: 'number', required: false, description: 'Itens por página', default: '30' },
    ],
  },
  {
    method: 'GET', path: '/api/v1/notifications/unread-count', description: 'Total de notificações não lidas', auth: true,
    response: `{ "data": { "count": 5 } }`,
  },
  { method: 'POST', path: '/api/v1/notifications/:id/read', description: 'Marca notificação como lida', auth: true },
  { method: 'POST', path: '/api/v1/notifications/read-all', description: 'Marca todas como lidas', auth: true },
  { method: 'DELETE', path: '/api/v1/notifications/:id', description: 'Remove uma notificação', auth: true },
  { method: 'GET', path: '/api/v1/notifications/preferences', description: 'Preferências de notificação', auth: true },
  {
    method: 'PUT', path: '/api/v1/notifications/preferences', description: 'Atualiza preferências', auth: true,
    body: [{ name: 'preferences', type: 'Array<{ notificationType, enabled }>', required: true, description: 'Array de preferências por tipo' }],
  },
];

export const ORG_ENDPOINTS: Endpoint[] = [
  {
    method: 'POST', path: '/api/v1/orgs', description: 'Cria uma organização', auth: true,
    body: [
      { name: 'name', type: 'string', required: true, description: 'Nome único da organização' },
      { name: 'displayName', type: 'string', required: false, description: 'Nome de exibição' },
      { name: 'description', type: 'string', required: false, description: 'Descrição' },
      { name: 'avatarUrl', type: 'string', required: false, description: 'URL do avatar' },
    ],
  },
  {
    method: 'GET', path: '/api/v1/orgs/:name', description: 'Detalhes de uma organização', auth: false,
    pathParams: [{ name: 'name', type: 'string', required: true, description: 'Nome da organização' }],
  },
  { method: 'PUT', path: '/api/v1/orgs/:name', description: 'Atualiza organização', auth: true },
  { method: 'DELETE', path: '/api/v1/orgs/:name', description: 'Exclui organização', auth: true },
  {
    method: 'POST', path: '/api/v1/orgs/:name/members', description: 'Convida membro para a organização', auth: true,
    body: [
      { name: 'username', type: 'string', required: true, description: 'Username do convidado' },
      { name: 'role', type: 'enum', required: false, description: 'OWNER, ADMIN ou MEMBER', default: 'MEMBER' },
    ],
  },
  { method: 'GET', path: '/api/v1/orgs/:name/members', description: 'Lista membros da organização', auth: false },
  { method: 'DELETE', path: '/api/v1/orgs/:name/members/:username', description: 'Remove membro', auth: true },
  {
    method: 'POST', path: '/api/v1/orgs/:name/teams', description: 'Cria um time', auth: true,
    body: [
      { name: 'name', type: 'string', required: true, description: 'Nome do time' },
      { name: 'description', type: 'string', required: false, description: 'Descrição' },
    ],
  },
  { method: 'GET', path: '/api/v1/orgs/:name/teams', description: 'Lista times da organização', auth: false },
  { method: 'GET', path: '/api/v1/orgs/user/memberships', description: 'Organizações do usuário logado', auth: true },
];

export const COLLAB_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/v1/repos/:owner/:repo/collaborators', description: 'Lista colaboradores do repositório', auth: false },
  {
    method: 'POST', path: '/api/v1/repos/:owner/:repo/collaborators', description: 'Adiciona colaborador', auth: true,
    body: [
      { name: 'username', type: 'string', required: true, description: 'Username do colaborador' },
      { name: 'role', type: 'enum', required: false, description: 'ADMIN, MAINTAINER, WRITE ou READ', default: 'READ' },
    ],
  },
  {
    method: 'PUT', path: '/api/v1/repos/:owner/:repo/collaborators/:username', description: 'Atualiza role do colaborador', auth: true,
    body: [{ name: 'role', type: 'enum', required: true, description: 'Novo role: ADMIN, MAINTAINER, WRITE ou READ' }],
  },
  { method: 'DELETE', path: '/api/v1/repos/:owner/:repo/collaborators/:username', description: 'Remove colaborador', auth: true },
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/collaborators/search', description: 'Busca usuários para adicionar', auth: true,
    queryParams: [{ name: 'q', type: 'string', required: false, description: 'Texto de busca' }],
  },
  { method: 'GET', path: '/api/v1/user/collaborated-repos', description: 'Repositórios onde sou colaborador', auth: true },
];

export const ACTIVITY_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: '/api/v1/repos/:owner/:repo/activity', description: 'Feed de atividade do repositório', auth: false,
    queryParams: [
      { name: 'limit', type: 'number', required: false, description: 'Limite', default: '30' },
      { name: 'offset', type: 'number', required: false, description: 'Offset', default: '0' },
    ],
  },
  {
    method: 'GET', path: '/api/v1/users/:username/activity', description: 'Feed de atividade do usuário', auth: false,
    queryParams: [
      { name: 'limit', type: 'number', required: false, description: 'Limite', default: '30' },
      { name: 'offset', type: 'number', required: false, description: 'Offset', default: '0' },
    ],
  },
];

export const INTEGRATION_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/v1/integrations/github/profile', description: 'Perfil GitHub vinculado', auth: true },
  { method: 'GET', path: '/api/v1/integrations/github/repos', description: 'Lista repos do GitHub', auth: true },
  {
    method: 'POST', path: '/api/v1/integrations/github/repos/:owner/:repo/import', description: 'Importa repositório do GitHub', auth: true,
    pathParams: [
      { name: 'owner', type: 'string', required: true, description: 'Owner no GitHub' },
      { name: 'repo', type: 'string', required: true, description: 'Nome do repo no GitHub' },
    ],
    response: `{ "data": { "jobId": "uuid", "status": "queued" } }`,
  },
  {
    method: 'GET', path: '/api/v1/integrations/github/import/:jobId/status', description: 'Status da importação', auth: true,
    pathParams: [{ name: 'jobId', type: 'string', required: true, description: 'ID do job' }],
  },
  { method: 'GET', path: '/api/v1/integrations/github/repos/:owner/:repo/sync', description: 'Sincroniza metadados do GitHub', auth: true },
];

export const ADMIN_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/v1/admin/instance/settings', description: 'Configurações da instância', auth: true, admin: true },
  {
    method: 'PUT', path: '/api/v1/admin/instance/settings', description: 'Atualiza configurações da instância', auth: true, admin: true,
    body: [
      { name: 'appName', type: 'string', required: false, description: 'Nome da aplicação' },
      { name: 'appLogoUrl', type: 'string', required: false, description: 'URL do logo' },
      { name: 'primaryColor', type: 'string', required: false, description: 'Cor primária (hex)' },
      { name: 'baseUrl', type: 'string', required: false, description: 'URL base' },
      { name: 'smtpHost', type: 'string', required: false, description: 'Host SMTP' },
      { name: 'smtpPort', type: 'number', required: false, description: 'Porta SMTP' },
      { name: 'smtpUser', type: 'string', required: false, description: 'Usuário SMTP' },
      { name: 'smtpFromEmail', type: 'string', required: false, description: 'Email remetente' },
      { name: 'smtpPassword', type: 'string', required: false, description: 'Senha SMTP' },
    ],
  },
  { method: 'GET', path: '/api/v1/admin/instance/health', description: 'Status de saúde do sistema', auth: true, admin: true },
  {
    method: 'GET', path: '/api/v1/admin/users', description: 'Lista todos os usuários', auth: true, admin: true,
    queryParams: [
      { name: 'page', type: 'number', required: false, description: 'Página', default: '1' },
      { name: 'limit', type: 'number', required: false, description: 'Itens por página', default: '25' },
    ],
  },
  {
    method: 'PATCH', path: '/api/v1/admin/users/:userId', description: 'Atualiza usuário como admin', auth: true, admin: true,
    body: [
      { name: 'systemRole', type: 'enum', required: false, description: 'USER ou SYSTEM_ADMIN' },
      { name: 'isDisabled', type: 'boolean', required: false, description: 'Desabilitar usuário' },
    ],
  },
];

export const AUDIT_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: '/api/v1/audit', description: 'Lista logs de auditoria', auth: true,
    queryParams: [
      { name: 'resource', type: 'string', required: false, description: 'Tipo de recurso (repository, user, etc)' },
      { name: 'resourceId', type: 'string', required: false, description: 'ID do recurso específico' },
      { name: 'action', type: 'string', required: false, description: 'Tipo de ação' },
      { name: 'page', type: 'number', required: false, description: 'Página', default: '1' },
      { name: 'limit', type: 'number', required: false, description: 'Itens por página', default: '50' },
    ],
  },
];
