import { Injectable } from '@nestjs/common';
import { IssueType, IssuePriority } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface DuplicateCandidate {
  id: string;
  number: number;
  title: string;
  status: string;
  score: number;
}

interface ClassificationResult {
  type: IssueType;
  confidence: number;
}

interface PrioritySuggestion {
  priority: IssuePriority;
  reason: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
}

export interface AnalysisResult {
  suggestedType: IssueType;
  typeConfidence: number;
  suggestedPriority: IssuePriority;
  priorityReason: string;
  suggestedArea: string | null;
  suggestedLabels: string[];
  suggestedChecklist: ChecklistItem[];
  duplicates: DuplicateCandidate[];
  userTrustLevel: 'trusted' | 'new';
}

// ── Keyword dictionaries ────────────────────────────────────

const TYPE_KEYWORDS: Record<IssueType, string[]> = {
  BUG: [
    'error', 'crash', 'fail', 'broken', 'bug', 'exception', 'incorrect', 'wrong',
    'not working', 'breaks', 'regression', 'undefined', 'null', 'stacktrace',
    'stack trace', 'unexpected', 'does not work', 'doesnt work', 'doesn\'t work',
    'throwing', 'fatal', 'segfault', 'corrupted', '500', '404', 'timeout',
  ],
  FEATURE: [
    'add', 'implement', 'support', 'allow', 'feature', 'request', 'would like',
    'should have', 'proposal', 'rfc', 'suggest', 'new feature', 'enhancement',
    'could we', 'can we add', 'it would be great', 'wish list', 'roadmap',
  ],
  QUESTION: [
    'how to', 'how do', 'why does', 'what is', 'when should', 'can i', 'is it possible',
    'help me', 'explain', 'documentation', 'guide', 'tutorial', 'confused',
  ],
  SUPPORT: [
    'install', 'setup', 'configure', 'deploy', 'version', 'can\'t connect',
    'connection', 'migration', 'upgrade', 'downgrade', 'compatibility',
    'environment', 'docker', 'build fails', 'dependency',
  ],
  IMPROVEMENT: [
    'improve', 'enhance', 'optimize', 'better', 'performance', 'refactor',
    'slow', 'faster', 'reduce', 'cleanup', 'technical debt', 'modernize',
    'usability', 'ux', 'ui improvement', 'polish',
  ],
};

const PRIORITY_CRITICAL_KEYWORDS = [
  'production down', 'critical', 'security vulnerability', 'data loss',
  'breaking change', 'urgent', 'outage', 'exploit', 'injection', 'xss',
  'authentication bypass', 'p0', 'sev0', 'sev1',
];

const PRIORITY_HIGH_KEYWORDS = [
  'all users', 'regression', 'blocked', 'severe', 'many users',
  'data corruption', 'performance degradation', 'memory leak', 'p1',
];

const PRIORITY_MEDIUM_KEYWORDS = [
  'intermittent', 'workaround', 'some users', 'minor bug', 'p2',
];

const AREA_KEYWORDS: Record<string, string[]> = {
  frontend: ['frontend', 'ui', 'css', 'button', 'page', 'component', 'layout', 'responsive', 'style', 'react', 'browser', 'display', 'render', 'animation'],
  backend: ['api', 'backend', 'database', 'query', 'server', 'endpoint', 'rest', 'controller', 'service', 'prisma', 'orm', 'migration'],
  auth: ['auth', 'login', 'oauth', 'token', 'session', 'password', 'permission', 'role', 'access', 'jwt', 'credential'],
  'git-engine': ['git', 'commit', 'push', 'pull', 'branch', 'merge', 'clone', 'diff', 'rebase', 'tag', 'ref', 'repository'],
  notifications: ['notification', 'email', 'alert', 'webhook', 'subscribe', 'watch', 'event'],
  infrastructure: ['docker', 'deploy', 'ci', 'cd', 'pipeline', 'kubernetes', 'nginx', 'redis', 'postgres'],
};

const DEFAULT_LABEL_COLORS: Record<IssueType, string> = {
  BUG: '#D73A49',
  FEATURE: '#0075CA',
  QUESTION: '#D876E3',
  SUPPORT: '#A78BFA',
  IMPROVEMENT: '#E8A838',
};

const CHECKLISTS: Record<IssueType, ChecklistItem[]> = {
  BUG: [
    { id: 'steps', text: 'Steps to reproduce', required: true },
    { id: 'expected', text: 'Expected behavior', required: true },
    { id: 'actual', text: 'Actual behavior', required: true },
    { id: 'environment', text: 'Environment details (OS, browser, version)', required: true },
    { id: 'logs', text: 'Error logs / stack trace', required: false },
    { id: 'screenshots', text: 'Screenshots if applicable', required: false },
  ],
  FEATURE: [
    { id: 'usecase', text: 'Use case description', required: true },
    { id: 'acceptance', text: 'Acceptance criteria', required: true },
    { id: 'users', text: 'Affected user segments', required: false },
    { id: 'alternatives', text: 'Alternative solutions considered', required: false },
  ],
  QUESTION: [
    { id: 'tried', text: 'What you have tried', required: true },
    { id: 'docs', text: 'Documentation / links consulted', required: false },
    { id: 'context', text: 'Additional context', required: false },
  ],
  SUPPORT: [
    { id: 'version', text: 'Application version', required: true },
    { id: 'install', text: 'Installation method', required: true },
    { id: 'error', text: 'Error message', required: true },
    { id: 'environment', text: 'Environment details', required: false },
  ],
  IMPROVEMENT: [
    { id: 'current', text: 'Current behavior', required: true },
    { id: 'proposed', text: 'Proposed improvement', required: true },
    { id: 'impact', text: 'Estimated impact', required: false },
    { id: 'tradeoffs', text: 'Known trade-offs', required: false },
  ],
};

@Injectable()
export class IssueAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 1. Detect Duplicates (TF-IDF similarity) ───────────────

  async detectDuplicates(
    repositoryId: string,
    title: string,
    body?: string,
  ): Promise<DuplicateCandidate[]> {
    const existingIssues = await this.prisma.issue.findMany({
      where: {
        repositoryId,
        status: { notIn: ['RESOLVED', 'WONT_FIX', 'CLOSED'] },
      },
      select: { id: true, number: true, title: true, body: true, status: true },
      take: 200,
      orderBy: { createdAt: 'desc' },
    });

    if (existingIssues.length === 0) return [];

    const inputTokens = this.tokenize(`${title} ${body ?? ''}`);
    if (inputTokens.size === 0) return [];

    const candidates: DuplicateCandidate[] = [];

    for (const existing of existingIssues) {
      const existingTokens = this.tokenize(`${existing.title} ${existing.body ?? ''}`);
      if (existingTokens.size === 0) continue;

      const score = this.cosineSimilarity(inputTokens, existingTokens);
      if (score >= 0.3) {
        candidates.push({
          id: existing.id,
          number: existing.number,
          title: existing.title,
          status: existing.status,
          score: Math.round(score * 100) / 100,
        });
      }
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  // ─── 2. Classify Issue ──────────────────────────────────────

  classifyIssue(title: string, body?: string): ClassificationResult {
    const text = `${title} ${body ?? ''}`.toLowerCase();
    const scores: Record<string, number> = {};

    for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (title.toLowerCase().includes(keyword)) score += 2;
        if (body && body.toLowerCase().includes(keyword)) score += 1;
      }
      scores[type] = score;
    }

    // Check for question marks as a signal for QUESTION type
    if (text.includes('?')) {
      scores['QUESTION'] = (scores['QUESTION'] ?? 0) + 1.5;
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return { type: IssueType.BUG, confidence: 0.1 };
    }

    const bestType = Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))[0] as IssueType;
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? Math.min(maxScore / totalScore + 0.2, 1) : 0.1;

    return { type: bestType, confidence: Math.round(confidence * 100) / 100 };
  }

  // ─── 3. Suggest Priority ────────────────────────────────────

  suggestPriority(title: string, body?: string, type?: IssueType): PrioritySuggestion {
    const text = `${title} ${body ?? ''}`.toLowerCase();

    for (const keyword of PRIORITY_CRITICAL_KEYWORDS) {
      if (text.includes(keyword)) {
        return { priority: IssuePriority.CRITICAL, reason: `Contains critical keyword: "${keyword}"` };
      }
    }

    for (const keyword of PRIORITY_HIGH_KEYWORDS) {
      if (text.includes(keyword)) {
        return { priority: IssuePriority.HIGH, reason: `Contains high-priority keyword: "${keyword}"` };
      }
    }

    for (const keyword of PRIORITY_MEDIUM_KEYWORDS) {
      if (text.includes(keyword)) {
        return { priority: IssuePriority.MEDIUM, reason: `Contains medium-priority keyword: "${keyword}"` };
      }
    }

    // Type-based defaults
    if (type === IssueType.BUG) {
      return { priority: IssuePriority.MEDIUM, reason: 'Default for bug reports' };
    }
    if (type === IssueType.SUPPORT) {
      return { priority: IssuePriority.MEDIUM, reason: 'Default for support requests' };
    }

    return { priority: IssuePriority.LOW, reason: 'No urgency signals detected' };
  }

  // ─── 4. Route to Area ──────────────────────────────────────

  routeToArea(title: string, body?: string): string | null {
    const text = `${title} ${body ?? ''}`.toLowerCase();
    const areaScores: Record<string, number> = {};

    for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) score++;
      }
      if (score > 0) areaScores[area] = score;
    }

    if (Object.keys(areaScores).length === 0) return null;
    return Object.entries(areaScores).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }

  // ─── 5. Generate Checklist ──────────────────────────────────

  generateChecklist(type: IssueType): ChecklistItem[] {
    return CHECKLISTS[type] ?? CHECKLISTS.BUG;
  }

  // ─── 6. Suggest Labels ─────────────────────────────────────

  suggestLabels(type: IssueType, title: string, body?: string): string[] {
    const labels: string[] = [];
    const typeName = type.toLowerCase();
    labels.push(typeName);

    const text = `${title} ${body ?? ''}`.toLowerCase();

    // Priority-based labels
    for (const keyword of PRIORITY_CRITICAL_KEYWORDS) {
      if (text.includes(keyword)) { labels.push('critical'); break; }
    }

    // Area-based labels
    const area = this.routeToArea(title, body);
    if (area) labels.push(area);

    return [...new Set(labels)];
  }

  // ─── 7. Get User Trust Level ────────────────────────────────

  async getUserTrustLevel(
    userId: string,
    repositoryId: string,
  ): Promise<'trusted' | 'new'> {
    // Check if user is a repository member
    const member = await this.prisma.repositoryMember.findUnique({
      where: { repositoryId_userId: { repositoryId, userId } },
    });
    if (member) return 'trusted';

    // Check if user is the repo owner
    const repo = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { ownerUserId: true, ownerOrgId: true },
    });
    if (repo?.ownerUserId === userId) return 'trusted';

    // Check if user is an org member (if repo owned by org)
    if (repo?.ownerOrgId) {
      const orgMember = await this.prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: repo.ownerOrgId, userId } },
      });
      if (orgMember) return 'trusted';
    }

    return 'new';
  }

  // ─── 8. Full Analysis ──────────────────────────────────────

  async analyze(
    repositoryId: string,
    userId: string,
    title: string,
    body?: string,
    explicitType?: IssueType,
  ): Promise<AnalysisResult> {
    const [duplicates, trustLevel] = await Promise.all([
      this.detectDuplicates(repositoryId, title, body),
      this.getUserTrustLevel(userId, repositoryId),
    ]);

    const classification = this.classifyIssue(title, body);
    const resolvedType = explicitType ?? classification.type;
    const prioritySuggestion = this.suggestPriority(title, body, resolvedType);
    const area = this.routeToArea(title, body);
    const suggestedLabels = this.suggestLabels(resolvedType, title, body);
    const checklist = this.generateChecklist(resolvedType);

    return {
      suggestedType: resolvedType,
      typeConfidence: classification.confidence,
      suggestedPriority: prioritySuggestion.priority,
      priorityReason: prioritySuggestion.reason,
      suggestedArea: area,
      suggestedLabels,
      suggestedChecklist: checklist,
      duplicates,
      userTrustLevel: trustLevel,
    };
  }

  // ─── Auto-create labels for issue type ──────────────────────

  async ensureTypeLabels(
    repositoryId: string,
    labelNames: string[],
    issueType: IssueType,
  ): Promise<string[]> {
    const labelIds: string[] = [];

    for (const name of labelNames) {
      const label = await this.prisma.label.upsert({
        where: { repositoryId_name: { repositoryId, name } },
        update: {},
        create: {
          repositoryId,
          name,
          color: DEFAULT_LABEL_COLORS[issueType] ?? '#6B7280',
          description: `Auto-generated label for ${name}`,
        },
      });
      labelIds.push(label.id);
    }

    return labelIds;
  }

  // ─── Private helpers ────────────────────────────────────────

  private tokenize(text: string): Map<string, number> {
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const freq = new Map<string, number>();
    for (const token of tokens) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
    return freq;
  }

  private cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    const allKeys = new Set([...a.keys(), ...b.keys()]);

    for (const key of allKeys) {
      const valA = a.get(key) ?? 0;
      const valB = b.get(key) ?? 0;
      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
