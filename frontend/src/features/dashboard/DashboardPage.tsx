import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  GitFork,
  Lock,
  Globe,
  Bell,
  GitPullRequest,
  AlertCircle,
  FolderGit,
  Zap,
  ChevronRight,
  Clock,
  Inbox,
  Flame,
  Tag,
  User,
  CheckCircle2,
  XCircle,
  MessageSquare,
  GitBranch,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboard } from '@/hooks/useDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { formatRelativeTime } from '@/lib/utils';

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  href?: string;
  color: string;
}) {
  const content = (
    <Card className="hover:border-primary-200 transition-colors">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          <p className="text-xs text-text-secondary">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

const ACTIVITY_ICON_MAP: Record<string, React.ElementType> = {
  PUSH: GitBranch,
  BRANCH_CREATED: GitBranch,
  BRANCH_DELETED: XCircle,
  TAG_CREATED: Tag,
  REPO_CREATED: FolderGit,
  REPO_FORKED: GitFork,
  ISSUE_OPENED: AlertCircle,
  ISSUE_CLOSED: CheckCircle2,
  PR_OPENED: GitPullRequest,
  PR_MERGED: GitPullRequest,
  PR_CLOSED: XCircle,
  COMMENT_ADDED: MessageSquare,
  REVIEW_SUBMITTED: CheckCircle2,
  MEMBER_ADDED: User,
  WIKI_PAGE_CREATED: BookOpen,
  WIKI_PAGE_UPDATED: BookOpen,
  WIKI_PAGE_DELETED: XCircle,
};

function ActivityIcon({ type }: { type: string }) {
  const Icon = ACTIVITY_ICON_MAP[type] || Zap;
  return (
    <div className="h-8 w-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-primary-600" />
    </div>
  );
}

function ActivityLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    PUSH: 'pushed to',
    BRANCH_CREATED: 'created branch',
    BRANCH_DELETED: 'deleted branch',
    TAG_CREATED: 'created tag',
    REPO_CREATED: 'created repository',
    REPO_FORKED: 'forked',
    ISSUE_OPENED: 'opened issue',
    ISSUE_CLOSED: 'closed issue',
    PR_OPENED: 'opened pull request',
    PR_MERGED: 'merged pull request',
    PR_CLOSED: 'closed pull request',
    COMMENT_ADDED: 'commented on',
    REVIEW_SUBMITTED: 'reviewed',
    MEMBER_ADDED: 'added member to',
    WIKI_PAGE_CREATED: 'created wiki page',
    WIKI_PAGE_UPDATED: 'updated wiki page',
    WIKI_PAGE_DELETED: 'deleted wiki page',
  };
  return <span className="text-text-secondary">{labels[type] || type.toLowerCase().replace(/_/g, ' ')}</span>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useDashboard();

  if (isLoading) return <PageLoader />;

  const { stats, assignedIssues, pendingPRs, recentRepos, recentActivity } = data ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatarUrl} alt={user?.displayName ?? user?.username ?? ''} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.displayName ?? user?.username}</h1>
            <p className="text-sm text-text-secondary">Here is what is happening across your projects</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/notifications">
              <Bell className="h-4 w-4 mr-1.5" />
              Notifications
              {stats && stats.notificationCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {stats.notificationCount}
                </Badge>
              )}
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/repositories/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New repository
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderGit}
          label="Repositories"
          value={stats?.repoCount ?? 0}
          href="/repositories"
          color="bg-blue-500"
        />
        <StatCard
          icon={AlertCircle}
          label="Open Issues"
          value={stats?.openIssueCount ?? 0}
          href="/repositories"
          color="bg-amber-500"
        />
        <StatCard
          icon={GitPullRequest}
          label="Pending PRs"
          value={stats?.openPrCount ?? 0}
          href="/repositories"
          color="bg-emerald-500"
        />
        <StatCard
          icon={Inbox}
          label="Notifications"
          value={stats?.notificationCount ?? 0}
          href="/notifications"
          color="bg-violet-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/repositories/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New repo
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/organizations/new">
            <User className="h-4 w-4 mr-1.5" />
            New org
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/integrations/github">
            <GitFork className="h-4 w-4 mr-1.5" />
            GitHub sync
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/settings/tokens">
            <Zap className="h-4 w-4 mr-1.5" />
            API tokens
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Repos */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderGit className="h-5 w-5 text-primary-500" />
                Recent repositories
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/repositories">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentRepos && recentRepos.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentRepos.map((repo, index) => (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Link
                        to={`/${repo.ownerUser?.username ?? repo.ownerOrg?.name ?? user?.username}/${repo.slug}`}
                        className="flex items-center justify-between py-3 transition-colors hover:bg-surface-hover -mx-5 px-5 first:-mt-1"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <BookOpen className="h-4 w-4 shrink-0 text-text-tertiary" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-primary-600 truncate">{repo.name}</span>
                              <Badge variant={repo.visibility === 'PUBLIC' ? 'outline' : 'secondary'} className="text-[10px] px-1.5">
                                {repo.visibility === 'PUBLIC' ? <Globe className="mr-0.5 h-2.5 w-2.5" /> : <Lock className="mr-0.5 h-2.5 w-2.5" />}
                                {repo.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                              </Badge>
                              {repo.isFork && (
                                <Badge variant="outline" className="text-[10px] px-1.5">
                                  <GitFork className="mr-0.5 h-2.5 w-2.5" /> Fork
                                </Badge>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-text-secondary truncate mt-0.5">{repo.description}</p>
                                )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-xs text-text-tertiary flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {repo._count.issues}
                          </span>
                          <span className="text-xs text-text-tertiary flex items-center gap-1">
                            <GitPullRequest className="h-3 w-3" />
                            {repo._count.pullRequests}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            {formatRelativeTime(repo.updatedAt)}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No repositories yet"
                  description="Create your first repository to get started."
                  action={
                    <Button asChild size="sm">
                      <Link to="/repositories/new">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create repository
                      </Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* Assigned Issues */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Assigned issues
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/repositories">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {assignedIssues && assignedIssues.length > 0 ? (
                <div className="divide-y divide-border">
                  {assignedIssues.map((issue, index) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Link
                        to={`/${issue.repository.ownerUser?.username ?? issue.repository.ownerOrg?.name}/${issue.repository.slug}/issues/${issue.number}`}
                        className="flex items-start justify-between py-3 transition-colors hover:bg-surface-hover -mx-5 px-5 first:-mt-1"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-primary-600 text-sm">{issue.title}</span>
                            {issue.labels.map((l) => (
                              <span
                                key={l.label.name}
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium border"
                                style={{
                                  backgroundColor: l.label.color + '20',
                                  borderColor: l.label.color + '40',
                                  color: l.label.color,
                                }}
                              >
                                {l.label.name}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-text-tertiary mt-1">
                            {issue.repository.ownerUser?.username ?? issue.repository.ownerOrg?.name}/{issue.repository.name} #{issue.number} opened {formatRelativeTime(issue.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Avatar src={issue.author.avatarUrl ?? undefined} alt={issue.author.username} size="sm" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="No assigned issues"
                  description="You have no open issues assigned to you."
                />
              )}
            </CardContent>
          </Card>

          {/* Pending PRs */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <GitPullRequest className="h-5 w-5 text-emerald-500" />
                Pending pull requests
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/repositories">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {pendingPRs && pendingPRs.length > 0 ? (
                <div className="divide-y divide-border">
                  {pendingPRs.map((pr, index) => (
                    <motion.div
                      key={pr.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Link
                        to={`/${pr.repository.ownerUser?.username ?? pr.repository.ownerOrg?.name}/${pr.repository.slug}/pulls/${pr.number}`}
                        className="flex items-start justify-between py-3 transition-colors hover:bg-surface-hover -mx-5 px-5 first:-mt-1"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary-600 text-sm">{pr.title}</span>
                            {pr.isDraft && (
                              <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                            )}
                          </div>
                          <p className="text-xs text-text-tertiary mt-1">
                            {pr.repository.ownerUser?.username ?? pr.repository.ownerOrg?.name}/{pr.repository.name} #{pr.number} opened {formatRelativeTime(pr.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Avatar src={pr.author.avatarUrl ?? undefined} alt={pr.author.username} size="sm" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="No pending pull requests"
                  description="You have no open pull requests requiring attention."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-5 w-5 text-orange-500" />
                Your activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="flex items-start gap-3"
                    >
                      <ActivityIcon type={activity.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-primary">
                          <ActivityLabel type={activity.type} />
                          {activity.repository && (
                            <Link
                              to={`/${activity.repository.ownerUser?.username ?? activity.repository.ownerOrg?.name}/${activity.repository.slug}`}
                              className="font-medium text-primary-600 hover:underline ml-1"
                            >
                              {activity.repository.name}
                            </Link>
                          )}
                        </p>
                        <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="No recent activity"
                  description="Your recent actions will appear here."
                />
              )}
            </CardContent>
          </Card>

          {/* Explore CTA */}
          <Card className="bg-gradient-to-br from-primary-500 to-violet-600 text-white border-0">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <h3 className="font-semibold">Explore SpectraGit</h3>
              </div>
              <p className="text-sm text-white/80">
                Discover trending repositories, popular developers, and inspiring projects from the community.
              </p>
              <Button variant="secondary" size="sm" className="w-full" asChild>
                <Link to="/explore">
                  Start exploring
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
