import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Server, Search, Globe, Shield, Layers, Database,
  Settings, Users, BookOpen, GitBranch, GitCommit, MessageSquare,
  GitPullRequest, Eye, Tag, Package, Bell, Building2, Activity,
  ExternalLink, LayoutDashboard, FileText,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Section, NavItem } from './types';
import { NAV_ITEMS } from './constants';
import {
  SETUP_ENDPOINTS, USERS_ENDPOINTS, REPO_ENDPOINTS, BRANCH_ENDPOINTS,
  COMMIT_ENDPOINTS, ISSUE_ENDPOINTS, PR_ENDPOINTS, REVIEW_ENDPOINTS,
  TAG_ENDPOINTS, RELEASE_ENDPOINTS, NOTIFICATION_ENDPOINTS, ORG_ENDPOINTS,
  COLLAB_ENDPOINTS, ACTIVITY_ENDPOINTS, INTEGRATION_ENDPOINTS, ADMIN_ENDPOINTS,
  AUDIT_ENDPOINTS,
} from './data/endpoints';
import { SectionEndpoints } from './components/SectionEndpoints';
import IntroductionSection from './sections/IntroductionSection';
import ArchitectureSection from './sections/ArchitectureSection';
import AuthenticationSection from './sections/AuthenticationSection';
import ErrorsSection from './sections/ErrorsSection';
import RateLimitsSection from './sections/RateLimitsSection';
import ExamplesSection from './sections/ExamplesSection';
import UserGuideSection from './sections/UserGuideSection';
import GitCommandsSection from './sections/GitCommandsSection';
import ManageReposSection from './sections/ManageReposSection';
import ManageIssuesSection from './sections/ManageIssuesSection';
import ManagePRsSection from './sections/ManagePRsSection';
import ManageOrgsSection from './sections/ManageOrgsSection';
import ManageReportsSection from './sections/ManageReportsSection';



export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState<Section>('user-guide');
  const [searchQuery, setSearchQuery] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const grouped = useMemo(() => {
    const groups: Record<string, NavItem[]> = {};
    for (const item of NAV_ITEMS) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, []);

  const filteredNav = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.toLowerCase();
    const result: Record<string, NavItem[]> = {};
    for (const [group, items] of Object.entries(grouped)) {
      const filtered = items.filter(
        (it) => it.label.toLowerCase().includes(q) || it.id.includes(q),
      );
      if (filtered.length > 0) result[group] = filtered;
    }
    return result;
  }, [searchQuery, grouped]);

  const navigateTo = (id: Section) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as Section);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 },
    );

    for (const ref of Object.values(sectionRefs.current)) {
      if (ref) observer.observe(ref);
    }

    return () => observer.disconnect();
  }, []);

  const registerRef = (id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <motion.div
      className="mx-auto max-w-7xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-primary-100">
            <Server className="h-7 w-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">API Documentation</h1>
            <p className="text-text-secondary">SpectraGit REST API v1 — Referência completa</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <Badge className="gap-1.5 bg-primary-100 text-primary-700 border-primary-200">
            <Globe className="h-3 w-3" /> Base URL: /api/v1
          </Badge>
          <Badge className="gap-1.5 bg-emerald-100 text-emerald-700 border-emerald-200">
            <Shield className="h-3 w-3" /> JWT Bearer Auth
          </Badge>
          <Badge className="gap-1.5 bg-amber-100 text-amber-700 border-amber-200">
            <Layers className="h-3 w-3" /> 110+ Endpoints
          </Badge>
          <Badge className="gap-1.5 bg-blue-100 text-blue-700 border-blue-200">
            <Database className="h-3 w-3" /> PostgreSQL + Redis
          </Badge>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin pb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar seção..."
                className="pl-9 h-8 text-xs"
              />
            </div>

            {Object.entries(filteredNav).map(([group, items]) => (
              <div key={group}>
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5 px-2">{group}</p>
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => navigateTo(item.id)}
                        className={cn(
                          'w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                          activeSection === item.id
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <div ref={contentRef} className="flex-1 min-w-0 space-y-16 pb-24">
          <section id="user-guide" ref={registerRef('user-guide')}><UserGuideSection /></section>
          <section id="git-guide" ref={registerRef('git-guide')}><GitCommandsSection /></section>
          <section id="manage-repos" ref={registerRef('manage-repos')}><ManageReposSection /></section>
          <section id="manage-issues" ref={registerRef('manage-issues')}><ManageIssuesSection /></section>
          <section id="manage-prs" ref={registerRef('manage-prs')}><ManagePRsSection /></section>
          <section id="manage-orgs" ref={registerRef('manage-orgs')}><ManageOrgsSection /></section>
          <section id="manage-reports" ref={registerRef('manage-reports')}><ManageReportsSection /></section>
          <section id="introduction" ref={registerRef('introduction')}><IntroductionSection /></section>
          <section id="architecture" ref={registerRef('architecture')}><ArchitectureSection /></section>
          <section id="authentication" ref={registerRef('authentication')}><AuthenticationSection /></section>
          <section id="errors" ref={registerRef('errors')}><ErrorsSection /></section>
          <section id="rate-limits" ref={registerRef('rate-limits')}><RateLimitsSection /></section>

          <section id="setup" ref={registerRef('setup')}>
            <SectionEndpoints title="Setup" icon={Settings} endpoints={SETUP_ENDPOINTS} description="Configuração inicial da instância self-hosted" />
          </section>
          <section id="users" ref={registerRef('users')}>
            <SectionEndpoints title="Usuários" icon={Users} endpoints={USERS_ENDPOINTS} description="Gerenciamento de perfil, avatar, SSH keys e busca" />
          </section>
          <section id="repositories" ref={registerRef('repositories')}>
            <SectionEndpoints title="Repositórios" icon={BookOpen} endpoints={REPO_ENDPOINTS} description="CRUD de repositórios, forks, stars, webhooks, proteção de branch e downloads" />
          </section>
          <section id="branches" ref={registerRef('branches')}>
            <SectionEndpoints title="Branches" icon={GitBranch} endpoints={BRANCH_ENDPOINTS} description="Criar, listar e deletar branches" />
          </section>
          <section id="commits" ref={registerRef('commits')}>
            <SectionEndpoints title="Commits" icon={GitCommit} endpoints={COMMIT_ENDPOINTS} description="Histórico de commits, detalhes, diffs e comparação" />
          </section>
          <section id="issues" ref={registerRef('issues')}>
            <SectionEndpoints title="Issues" icon={MessageSquare} endpoints={ISSUE_ENDPOINTS} description="Criar, listar, atualizar issues e adicionar comentários" />
          </section>
          <section id="pull-requests" ref={registerRef('pull-requests')}>
            <SectionEndpoints title="Pull Requests" icon={GitPullRequest} endpoints={PR_ENDPOINTS} description="Criar, gerenciar, fazer merge e comentar em PRs" />
          </section>
          <section id="reviews" ref={registerRef('reviews')}>
            <SectionEndpoints title="Reviews" icon={Eye} endpoints={REVIEW_ENDPOINTS} description="Submeter reviews e comentários inline em PRs" />
          </section>
          <section id="tags" ref={registerRef('tags')}>
            <SectionEndpoints title="Tags" icon={Tag} endpoints={TAG_ENDPOINTS} description="Criar e gerenciar tags Git" />
          </section>
          <section id="releases" ref={registerRef('releases')}>
            <SectionEndpoints title="Releases" icon={Package} endpoints={RELEASE_ENDPOINTS} description="Publicar releases com assets para download" />
          </section>
          <section id="notifications" ref={registerRef('notifications')}>
            <SectionEndpoints title="Notificações" icon={Bell} endpoints={NOTIFICATION_ENDPOINTS} description="Gerenciar notificações e preferências" />
          </section>
          <section id="organizations" ref={registerRef('organizations')}>
            <SectionEndpoints title="Organizações" icon={Building2} endpoints={ORG_ENDPOINTS} description="Criar organizações, gerenciar membros e times" />
          </section>
          <section id="collaborators" ref={registerRef('collaborators')}>
            <SectionEndpoints title="Colaboradores" icon={Users} endpoints={COLLAB_ENDPOINTS} description="Gerenciar acesso e permissões em repositórios" />
          </section>
          <section id="activity" ref={registerRef('activity')}>
            <SectionEndpoints title="Atividade" icon={Activity} endpoints={ACTIVITY_ENDPOINTS} description="Feed de atividade de repositórios e usuários" />
          </section>
          <section id="integrations" ref={registerRef('integrations')}>
            <SectionEndpoints title="Integrações GitHub" icon={ExternalLink} endpoints={INTEGRATION_ENDPOINTS} description="Importar e sincronizar repositórios do GitHub" />
          </section>
          <section id="admin" ref={registerRef('admin')}>
            <SectionEndpoints title="Admin" icon={LayoutDashboard} endpoints={ADMIN_ENDPOINTS} description="Painel administrativo (SYSTEM_ADMIN requerido)" />
          </section>
          <section id="audit" ref={registerRef('audit')}>
            <SectionEndpoints title="Auditoria" icon={FileText} endpoints={AUDIT_ENDPOINTS} description="Logs de auditoria e segurança" />
          </section>

          <section id="examples" ref={registerRef('examples')}><ExamplesSection /></section>
        </div>
      </div>
    </motion.div>
  );
}
