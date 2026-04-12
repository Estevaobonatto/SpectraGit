import {
  Book, Shield, Code2, AlertTriangle, GitBranch, GitCommit,
  GitPullRequest, Tag, Package, Bell, Building2, Users, Activity,
  Settings, FileText, Eye, LayoutDashboard, ExternalLink,
  Zap, Network, BookOpen, MessageSquare, Rocket, FolderGit2,
  ListTodo, GitMerge, BarChart3, Terminal,
} from 'lucide-react';
import type { NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'user-guide', label: 'Primeiros Passos', icon: Rocket, group: 'Guia do Usuário' },
  { id: 'git-guide', label: 'Comandos Git', icon: Terminal, group: 'Guia do Usuário' },
  { id: 'manage-repos', label: 'Repositórios', icon: FolderGit2, group: 'Guia do Usuário' },
  { id: 'manage-issues', label: 'Issues & Projetos', icon: ListTodo, group: 'Guia do Usuário' },
  { id: 'manage-prs', label: 'Pull Requests', icon: GitMerge, group: 'Guia do Usuário' },
  { id: 'manage-orgs', label: 'Organizações & Times', icon: Building2, group: 'Guia do Usuário' },
  { id: 'manage-reports', label: 'Relatórios & Auditoria', icon: BarChart3, group: 'Guia do Usuário' },
  { id: 'introduction', label: 'Introdução', icon: Book, group: 'Visão Geral' },
  { id: 'architecture', label: 'Arquitetura', icon: Network, group: 'Visão Geral' },
  { id: 'authentication', label: 'Autenticação', icon: Shield, group: 'Visão Geral' },
  { id: 'errors', label: 'Erros Comuns', icon: AlertTriangle, group: 'Visão Geral' },
  { id: 'rate-limits', label: 'Rate Limits', icon: Zap, group: 'Visão Geral' },
  { id: 'setup', label: 'Setup', icon: Settings, group: 'Endpoints' },
  { id: 'users', label: 'Usuários', icon: Users, group: 'Endpoints' },
  { id: 'repositories', label: 'Repositórios', icon: BookOpen, group: 'Endpoints' },
  { id: 'branches', label: 'Branches', icon: GitBranch, group: 'Endpoints' },
  { id: 'commits', label: 'Commits', icon: GitCommit, group: 'Endpoints' },
  { id: 'issues', label: 'Issues', icon: MessageSquare, group: 'Endpoints' },
  { id: 'pull-requests', label: 'Pull Requests', icon: GitPullRequest, group: 'Endpoints' },
  { id: 'reviews', label: 'Reviews', icon: Eye, group: 'Endpoints' },
  { id: 'tags', label: 'Tags', icon: Tag, group: 'Endpoints' },
  { id: 'releases', label: 'Releases', icon: Package, group: 'Endpoints' },
  { id: 'notifications', label: 'Notificações', icon: Bell, group: 'Endpoints' },
  { id: 'organizations', label: 'Organizações', icon: Building2, group: 'Endpoints' },
  { id: 'collaborators', label: 'Colaboradores', icon: Users, group: 'Endpoints' },
  { id: 'activity', label: 'Atividade', icon: Activity, group: 'Endpoints' },
  { id: 'integrations', label: 'Integrações GitHub', icon: ExternalLink, group: 'Endpoints' },
  { id: 'admin', label: 'Admin', icon: LayoutDashboard, group: 'Endpoints' },
  { id: 'audit', label: 'Auditoria', icon: FileText, group: 'Endpoints' },
  { id: 'examples', label: 'Exemplos de Uso', icon: Code2, group: 'Guias' },
];

export const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  POST: 'bg-blue-100 text-blue-700 border-blue-200',
  PUT: 'bg-amber-100 text-amber-700 border-amber-200',
  PATCH: 'bg-orange-100 text-orange-700 border-orange-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
};
