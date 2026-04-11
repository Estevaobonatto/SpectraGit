import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  BookMarked,
  ExternalLink,
  Star,
  Code2,
  Folder,
  User as UserIcon,
  Wrench,
  Globe,
  Briefcase,
  MessageCircle,
} from 'lucide-react';
import { usePublicProfile, useLanguageStats, useCommitHeatmap } from '@/hooks/useProfile';
import { useRepositories } from '@/hooks/useRepositories';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MarkdownRenderer } from '@/components/repo/MarkdownRenderer';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { motion } from 'motion/react';

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  github: Code2,
  twitter: MessageCircle,
  linkedin: Briefcase,
  portfolio: Globe,
  custom: LinkIcon,
};

function CommitHeatmap({ username, chartColor, chartStyle }: { username: string; chartColor?: string | null; chartStyle?: string | null }) {
  const { data } = useCommitHeatmap(username);
  if (!data) return null;

  const baseColor = chartColor || '#7C3AED';
  const style = chartStyle || 'default';

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(110,118,129,0.15)';
    if (style === 'warm') {
      if (count <= 2) return '#fde68a';
      if (count <= 5) return '#f59e0b';
      if (count <= 10) return '#ea580c';
      return '#dc2626';
    }
    if (style === 'cool') {
      if (count <= 2) return '#bfdbfe';
      if (count <= 5) return '#60a5fa';
      if (count <= 10) return '#2563eb';
      return '#1d4ed8';
    }
    if (style === 'neon') {
      if (count <= 2) return '#86efac';
      if (count <= 5) return '#22c55e';
      if (count <= 10) return '#16a34a';
      return '#15803d';
    }
    // default / custom - use baseColor with opacity
    if (count <= 2) return `${baseColor}40`;
    if (count <= 5) return `${baseColor}80`;
    if (count <= 10) return `${baseColor}c0`;
    return baseColor;
  };

  // Build 52 weeks x 7 days grid
  const weeks: { date: string; count: number }[][] = [];
  const endDate = new Date(data.endDate);
  const startDate = new Date(data.startDate);

  // Build from Sunday of the start week
  const current = new Date(startDate);
  current.setDate(current.getDate() - current.getDay());

  let currentWeek: { date: string; count: number }[] = [];
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    currentWeek.push({ date: dateStr, count: data.heatmap[dateStr] || 0 });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {data.totalContributions} contributions in the last year
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <TooltipProvider>
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <Tooltip key={day.date}>
                      <TooltipTrigger asChild>
                        <div
                          className="h-[11px] w-[11px] rounded-[2px] transition-colors"
                          style={{ backgroundColor: getColor(day.count) }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {day.count} contribution{day.count !== 1 ? 's' : ''} on {day.date}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-text-tertiary justify-end">
          <span>Less</span>
          {[0, 2, 5, 10, 15].map((v) => (
            <div key={v} className="h-[10px] w-[10px] rounded-[2px]" style={{ backgroundColor: getColor(v) }} />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LanguageSidebar({ username }: { username: string }) {
  const { data } = useLanguageStats(username);
  if (!data || data.languages.length === 0) return null;

  const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Code2 className="h-4 w-4" />
          Languages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Color bar */}
        <div className="flex h-2 rounded-full overflow-hidden">
          {data.languages.slice(0, 8).map((lang, i) => (
            <div
              key={lang.language}
              style={{ width: `${lang.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
            />
          ))}
        </div>
        {/* Legend */}
        <div className="space-y-1">
          {data.languages.slice(0, 8).map((lang, i) => (
            <div key={lang.language} className="flex items-center gap-2 text-xs">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-text-secondary flex-1">{lang.language}</span>
              <span className="text-text-tertiary">{lang.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return <MarkdownRenderer content={content} />;
}

export default function ProfilePage() {
  const { owner } = useParams();
  const { data: profile, isLoading } = usePublicProfile(owner!);
  const { data: repos } = useRepositories();

  if (isLoading || !profile) return <PageLoader />;

  const repoList = repos?.data ?? [];
  const userProfile = profile.profile;
  const pinnedRepos = userProfile?.pinnedRepos ?? [];
  const sections = userProfile?.sections ?? [];
  const socialLinks = userProfile?.socialLinks ?? [];
  const skills = userProfile?.skills ?? [];
  const projects = userProfile?.projects ?? [];

  // Background styles
  const bgStyle: React.CSSProperties = {};
  if (userProfile?.backgroundType === 'solid' && userProfile.backgroundColor) {
    bgStyle.backgroundColor = userProfile.backgroundColor;
  } else if (userProfile?.backgroundType === 'image' && userProfile.backgroundImage) {
    bgStyle.backgroundImage = `url(${userProfile.backgroundImage})`;
    bgStyle.backgroundSize = 'cover';
    bgStyle.backgroundPosition = 'center';
  }

  return (
    <>
      {/* Custom CSS (scoped) */}
      {userProfile?.backgroundType === 'css' && userProfile.customCss && (
        <style>{`.profile-custom { ${userProfile.customCss} }`}</style>
      )}

      <motion.div
        className={`flex gap-8 ${userProfile?.backgroundType === 'css' ? 'profile-custom' : ''}`}
        style={bgStyle}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Profile sidebar */}
        <aside className="w-72 shrink-0 space-y-4">
          <Avatar src={profile.avatarUrl} alt={profile.username} size="lg" className="h-64 w-64 rounded-full" />
          <div>
            {profile.displayName && <h1 className="text-2xl font-bold text-text-primary">{profile.displayName}</h1>}
            <p className="text-lg text-text-tertiary">@{profile.username}</p>
          </div>
          {profile.bio && <p className="text-sm text-text-secondary">{profile.bio}</p>}
          <div className="space-y-1 text-sm text-text-secondary">
            {profile.location && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-text-tertiary" />
                {profile.location}
              </p>
            )}
            {profile.website && (
              <p className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-text-tertiary" />
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </p>
            )}
            {profile.createdAt && (
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-text-tertiary" />
                Joined {formatDate(profile.createdAt)}
              </p>
            )}
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="space-y-1">
              <Separator />
              {socialLinks.map((link) => {
                const Icon = PLATFORM_ICONS[link.platform] || Globe;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary-600 transition-colors py-0.5"
                  >
                    <Icon className="h-4 w-4 text-text-tertiary" />
                    {link.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* Language Stats */}
          <LanguageSidebar username={owner!} />
        </aside>

        <Separator orientation="vertical" />

        {/* Main content */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* Readme / Main description */}
          {userProfile?.readmeContent && (
            <Card>
              <CardContent className="pt-6">
                <MarkdownContent content={userProfile.readmeContent} />
              </CardContent>
            </Card>
          )}

          {/* About Me */}
          {userProfile?.aboutMe && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  About Me
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownContent content={userProfile.aboutMe} />
              </CardContent>
            </Card>
          )}

          {/* Commit Heatmap */}
          <CommitHeatmap
            username={owner!}
            chartColor={userProfile?.commitChartColor}
            chartStyle={userProfile?.commitChartStyle}
          />

          {/* Pinned Repositories */}
          {pinnedRepos.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Pinned Repositories
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {pinnedRepos.map((pin, index) => (
                  <motion.div
                    key={pin.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <Link
                      to={`/${pin.repository.ownerUser?.username ?? owner}/${pin.repository.name}`}
                      className="block rounded-[var(--radius-md)] border border-border p-4 transition-colors hover:bg-surface-hover h-full"
                    >
                      <div className="flex items-center gap-2">
                        <BookMarked className="h-4 w-4 text-text-tertiary" />
                        <span className="font-semibold text-primary-600 text-sm">{pin.repository.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{pin.repository.visibility}</Badge>
                      </div>
                      {pin.repository.description && (
                        <p className="mt-1 text-xs text-text-secondary line-clamp-2">{pin.repository.description}</p>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {skills.map((skill) => (
                  <div key={skill.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{skill.name}</span>
                      <span className="text-xs text-text-tertiary">{skill.proficiency}%</span>
                    </div>
                    <Progress value={skill.proficiency} className="h-2" />
                    {skill.relatedProjects.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {skill.relatedProjects.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border border-border rounded-[var(--radius-md)] p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-primary">{project.name}</span>
                      {project.repoUrl && (
                        <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-primary-600">
                          <Code2 className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-primary-600">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-xs text-text-secondary mt-1">{project.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Custom Sections */}
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownContent content={section.content} />
              </CardContent>
            </Card>
          ))}

          {/* All Repositories */}
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
              <BookMarked className="h-4 w-4" />
              Repositories
            </h2>
            {repoList.length === 0 ? (
              <EmptyState icon={BookMarked} title="No repositories yet" description="This user hasn't created any repositories." />
            ) : (
              <div className="space-y-3">
                {repoList.map((r, index) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <Link
                      to={`/${owner}/${r.name}`}
                      className="block rounded-[var(--radius-md)] border border-border p-4 transition-colors hover:bg-surface-hover"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary-600">{r.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{r.visibility}</Badge>
                      </div>
                      {r.description && <p className="mt-1 text-sm text-text-secondary line-clamp-2">{r.description}</p>}
                      <div className="mt-2 flex items-center gap-3 text-xs text-text-tertiary">
                        {r.language && <span>{r.language}</span>}
                        <span>Updated {formatRelativeTime(r.updatedAt)}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </motion.div>
    </>
  );
}
