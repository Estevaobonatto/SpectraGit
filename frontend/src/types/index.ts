export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  readmeContent: string | null;
  aboutMe: string | null;
  backgroundType: 'solid' | 'image' | 'css';
  backgroundColor: string | null;
  backgroundImage: string | null;
  customCss: string | null;
  commitChartColor: string | null;
  commitChartStyle: string | null;
  sections: ProfileSection[];
  socialLinks: SocialLink[];
  pinnedRepos: PinnedRepository[];
  skills: UserSkill[];
  projects: ProfileProject[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSection {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  sortOrder: number;
  createdAt: string;
}

export interface PinnedRepository {
  id: string;
  repositoryId: string;
  sortOrder: number;
  repository: Pick<Repository, 'id' | 'name' | 'slug' | 'description' | 'visibility'> & {
    ownerUser?: { username: string } | null;
    ownerOrg?: { name: string } | null;
    topics?: string[];
    updatedAt?: string;
  };
  createdAt: string;
}

export interface UserSkill {
  id: string;
  name: string;
  proficiency: number;
  relatedProjects: string[];
  sortOrder: number;
  createdAt: string;
}

export interface ProfileProject {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LanguageStat {
  language: string;
  bytes: number;
  percentage: number;
}

export interface CommitHeatmapData {
  heatmap: Record<string, number>;
  totalContributions: number;
  startDate: string;
  endDate: string;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
  profile: UserProfile | null;
  _count: { ownedRepos: number };
}

export interface SSHKey {
  id: string;
  title: string;
  fingerprint: string;
  createdAt: string;
}

export interface OAuthAccount {
  id: string;
  provider: 'google' | 'github';
  providerUserId: string;
  scope: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface NotificationPreference {
  notificationType: NotificationType;
  enabled: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Repository {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  topics: string[];
  visibility: 'PUBLIC' | 'PRIVATE';
  defaultBranch: string;
  hasIssuesEnabled: boolean;
  hasPRsEnabled: boolean;
  hasWikiEnabled: boolean;
  allowMergeCommit: boolean;
  allowSquashMerge: boolean;
  allowRebaseMerge: boolean;
  autoDeleteBranch: boolean;
  isArchived: boolean;
  isFork: boolean;
  forkSourceRepoId: string | null;
  ownerUserId: string | null;
  ownerOrgId: string | null;
  owner?: User;
  ownerUser?: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  ownerOrg?: { id: string; name: string; avatarUrl: string | null };
  organization?: Organization;
  pulseCount?: number;
  forkCount?: number;
  watchCount?: number;
  isPulsed?: boolean;
  isWatched?: boolean;
  canEdit?: boolean;
  language?: string | null;
  githubRepoFullName?: string | null;
  mirrorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  headCommitSha: string;
  isProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  commitSha: string;
  message: string | null;
  release?: { id: string; name: string } | null;
  createdAt: string;
}

export interface Release {
  id: string;
  name: string;
  body: string | null;
  targetBranch: string;
  isDraft: boolean;
  isPrerelease: boolean;
  tag: Tag;
  author?: User;
  assets: ReleaseAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface ReleaseAsset {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export interface Commit {
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl?: string | null;
  date: string;
  filesChanged?: number;
  insertions?: number;
  deletions?: number;
}

export interface CommitDetail extends Commit {
  diff: DiffFile[];
}

export interface DiffFile {
  filePath: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'del' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeItem[];
  lastCommit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
}

export interface FileContent {
  name: string;
  path: string;
  content: string;
  size: number;
  encoding: string;
}

export type IssueType = 'BUG' | 'FEATURE' | 'QUESTION' | 'SUPPORT' | 'IMPROVEMENT';
export type IssuePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueCloseReason = 'FIXED' | 'DUPLICATE' | 'NOT_REPRODUCIBLE' | 'NOT_PLANNED' | 'OBSOLETE';
export type IssueStatusFull = 'OPEN' | 'CLOSED' | 'TRIAGE' | 'CONFIRMED' | 'IN_PROGRESS' | 'BLOCKED' | 'WAITING_USER' | 'RESOLVED' | 'WONT_FIX';

export interface Issue {
  id: string;
  number: number;
  title: string;
  body: string | null;
  status: IssueStatusFull;
  type: IssueType | null;
  priority: IssuePriority | null;
  closeReason: IssueCloseReason | null;
  closeReasonNote: string | null;
  assignedArea: string | null;
  techContext: Record<string, unknown> | null;
  formData: Record<string, unknown> | null;
  authorId: string;
  author?: User;
  assigneeId: string | null;
  assignee?: User;
  labels?: Label[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface IssueAnalysis {
  suggestedType: IssueType;
  typeConfidence: number;
  suggestedPriority: IssuePriority;
  priorityReason: string;
  suggestedArea: string | null;
  suggestedLabels: string[];
  suggestedChecklist: { id: string; text: string; required: boolean }[];
  duplicates: { id: string; number: number; title: string; status: string; score: number }[];
  userTrustLevel: 'trusted' | 'new';
}

export interface Label {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ContextBlocks {
  problem?: string;
  solution?: string;
  impact?: string;
  testInstructions?: string;
}

export interface PRDiffStats {
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  commitCount: number;
  categories: {
    backend: number;
    frontend: number;
    database: number;
    docs: number;
    infra: number;
  };
}

export interface PullRequestReviewer {
  id: string;
  pullRequestId: string;
  userId: string;
  requestedAt: string;
  user: Pick<User, 'id' | 'username' | 'avatarUrl'>;
}

export interface PullRequestDependency {
  id: string;
  dependentPrId: string;
  dependsOnPrId: string;
  repositoryId: string;
}

export interface PRBlocker {
  type: 'CONFLICT' | 'CHANGES_REQUESTED' | 'REVIEW_PENDING' | 'DRAFT';
  message: string;
}

export interface PRTimelineEvent {
  type: string;
  actor: Pick<User, 'username' | 'avatarUrl'> | null;
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface PrRiskConfig {
  maxFiles?: number;
  maxLines?: number;
  criticalPaths?: string[];
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  body: string | null;
  status: 'OPEN' | 'CLOSED' | 'MERGED';
  isDraft: boolean;
  sourceBranch: string;
  targetBranch: string;
  authorId: string;
  author?: User;
  mergedBy?: User;
  mergedAt: string | null;
  mergeStrategy: string | null;
  checklist: ChecklistItem[];
  contextBlocks: ContextBlocks | null;
  labels?: Label[];
  reviews?: Review[];
  comments?: Comment[];
  requestedReviewers?: PullRequestReviewer[];
  dependenciesOut?: PullRequestDependency[];
  dependenciesIn?: PullRequestDependency[];
  diffStats?: PRDiffStats | null;
  riskLevel?: RiskLevel | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  pullRequestId: string;
  reviewerId: string;
  reviewer?: User;
  authorId: string;
  author?: User;
  status: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
  body: string | null;
  comments?: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  body: string;
  authorId: string;
  author?: User;
  issueId?: string;
  pullRequestId?: string;
  reviewId?: string;
  filePath?: string;
  lineNumber?: number;
  resolved: boolean;
  resolvedById?: string;
  resolvedBy?: Pick<User, 'username' | 'avatarUrl'>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'ISSUE_CREATED'
  | 'ISSUE_CLOSED'
  | 'ISSUE_COMMENT'
  | 'PR_CREATED'
  | 'PR_MERGED'
  | 'PR_CLOSED'
  | 'PR_COMMENT'
  | 'PR_REVIEW'
  | 'MENTION'
  | 'REPO_PUSHED'
  | 'REPO_INVITE'
  | 'ORG_INVITE'
  | 'COLLABORATOR_ADDED'
  | 'COLLABORATOR_REMOVED'
  | 'COLLABORATOR_ROLE_CHANGED';

export interface Organization {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RepoRole = 'ADMIN' | 'MAINTAINER' | 'WRITE' | 'READ';

export interface Collaborator {
  id: string;
  userId: string;
  role: RepoRole;
  createdAt: string;
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'> & { email?: string };
}

export interface CollaboratorSearchUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  orgRole?: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  user?: User;
  organization?: Organization;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  user?: User;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GitHubRepo {
  id: number;
  fullName: string;
  name: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  updatedAt: string;
  ownerLogin: string;
  ownerType: 'User' | 'Organization';
}

export interface GitHubPermissions {
  hasRepo: boolean;
  hasReadOrg: boolean;
  scopes: string[];
}

export interface SyncStatusResponse {
  lastSyncedAt: string | null;
  mirrorEnabled: boolean;
  githubRepoFullName: string | null;
}

export interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetAt: string | null;
  resetInSeconds: number;
  isHealthy: boolean;
}

export interface TokenHealth {
  valid: boolean;
  scopes: string[];
  expiresAt: string | null;
}

export interface WebhookEventItem {
  id: string;
  repositoryId: string | null;
  eventType: string;
  deliveryId: string;
  processed: boolean;
  error: string | null;
  createdAt: string;
}

export interface MirrorResponse {
  mirrored: boolean;
  action: 'created' | 'updated';
  githubNumber?: number;
  githubId?: number;
}

export interface RepoContributor {
  name: string;
  email: string;
  commits: number;
}

export interface RepoStats {
  languages: Record<string, number>;
  contributors: RepoContributor[];
  branchCount: number;
  tagCount: number;
  openIssueCount: number;
  openPrCount: number;
  labelCount: number;
}

export type ImportJobStatus =
  | 'PENDING'
  | 'CLONING'
  | 'SEEDING_BRANCHES'
  | 'IMPORTING_LABELS'
  | 'IMPORTING_MILESTONES'
  | 'IMPORTING_ISSUES'
  | 'IMPORTING_PRS'
  | 'IMPORTING_TAGS'
  | 'COMPLETED'
  | 'FAILED';

export interface ImportJobResponse {
  jobId: string | null;
  repositorySlug: string;
  ownerUsername: string;
  alreadyRunning?: boolean;
  alreadyImported?: boolean;
}

export interface ImportJobStatusResponse {
  id: string;
  status: ImportJobStatus;
  progress: number;
  currentStep: string | null;
  error: string | null;
  repositorySlug: string | null;
  ownerUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
  error: null | {
    code: string;
    message: string;
  };
}

// ─── Branch Protection ───────────────────────────────────────

export interface BranchProtectionRule {
  id: string;
  branchId: string;
  requirePullRequest: boolean;
  requiredReviewCount: number;
  dismissStaleReviews: boolean;
  requireCodeOwnerReview: boolean;
  restrictPushes: boolean;
  allowForcePushes: boolean;
  allowDeletions: boolean;
  requireLinearHistory: boolean;
  lockBranch: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchProtection {
  branchName: string;
  isProtected: boolean;
  protection: BranchProtectionRule | null;
}

// ─── Webhooks ────────────────────────────────────────────────

export type WebhookEvent =
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'issue_comment'
  | 'create'
  | 'delete'
  | 'release'
  | 'fork'
  | 'watch';

export interface Webhook {
  id: string;
  url: string;
  contentType: string;
  events: string[];
  isActive: boolean;
  lastStatus: number | null;
  lastError: string | null;
  lastCalledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Wiki ────────────────────────────────────────────────────

export type WikiSourceMode = 'PLATFORM' | 'REPOSITORY' | 'HYBRID';

export interface WikiSettings {
  id: string;
  repositoryId: string;
  sourceMode: WikiSourceMode;
  sourceBranch: string;
  sourceRoot: string;
  homePage: string;
  allowComments: boolean;
  allowAttachments: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WikiPage {
  id: string;
  repositoryId: string;
  slug: string;
  title: string;
  body: string;
  parentId: string | null;
  sortOrder: number;
  createdById: string;
  updatedById: string | null;
  createdBy?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  updatedBy?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'> | null;
  children?: Pick<WikiPage, 'id' | 'slug' | 'title' | 'sortOrder'>[];
  createdAt: string;
  updatedAt: string;
}

export interface WikiPageVersion {
  id: string;
  pageId: string;
  title: string;
  body: string;
  version: number;
  editorId: string;
  editor?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  message: string | null;
  createdAt: string;
}

export interface WikiComment {
  id: string;
  pageId: string;
  authorId: string;
  author?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  body: string;
  createdAt: string;
  updatedAt: string;
}
