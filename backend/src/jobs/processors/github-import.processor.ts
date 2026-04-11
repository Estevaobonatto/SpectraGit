import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Octokit } from '@octokit/rest';
import {
  ImportJobStatus,
  IssueStatus,
  PRStatus,
  CommentType,
  RepoVisibility,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GitService } from '../../modules/git/git.service';

interface ImportJobPayload {
  jobId: string;
  userId: string;
  githubRepoFullName: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface GHLabel {
  name: string;
  color: string;
  description: string | null;
}
interface GHMilestone {
  number: number;
  title: string;
  description: string | null;
  due_on: string | null;
}
interface GHIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  pull_request?: any;
  milestone?: { number: number } | null;
  labels: Array<string | { name: string }>;
  comments: number;
}
interface GHPullRequest {
  number: number;
  title: string;
  body: string | null;
  state: string;
  merged_at: string | null;
  head?: { ref: string };
  base?: { ref: string };
  labels: Array<string | { name: string }>;
}
interface GHComment {
  body: string | null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

@Processor('github-import')
export class GitHubImportProcessor extends WorkerHost {
  private readonly logger = new Logger(GitHubImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gitService: GitService,
  ) {
    super();
  }

  async process(job: Job<ImportJobPayload>) {
    const { jobId, userId, githubRepoFullName } = job.data;
    this.logger.log(`Starting full import: ${githubRepoFullName} (job ${jobId})`);

    try {
      // ── Step 1: Validate token + fetch metadata (0–5%) ──
      await this.updateProgress(jobId, ImportJobStatus.PENDING, 1, 'Connecting to GitHub...');

      const oauthAccount = await this.prisma.oAuthAccount.findFirst({
        where: { userId, provider: 'github' },
      });
      if (!oauthAccount?.encryptedAccessToken) {
        throw new Error('GitHub account not linked');
      }
      const token = oauthAccount.encryptedAccessToken;
      const octokit = new Octokit({ auth: token });

      const [owner, repoName] = githubRepoFullName.split('/');
      const { data: githubRepo } = await octokit.repos.get({ owner, repo: repoName });

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const slug = githubRepo.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
      await this.updateProgress(jobId, ImportJobStatus.PENDING, 5, 'GitHub connected');

      // ── Step 2: Ensure repository DB record exists ──
      let repo = await this.prisma.repository.findFirst({
        where: { ownerUserId: userId, slug },
      });

      if (!repo) {
        repo = await this.prisma.repository.create({
          data: {
            ownerUserId: userId,
            name: githubRepo.name,
            slug,
            description: githubRepo.description ?? null,
            visibility: githubRepo.private ? RepoVisibility.PRIVATE : RepoVisibility.PUBLIC,
            defaultBranch: githubRepo.default_branch ?? 'main',
            githubExternalId: String(githubRepo.id),
          },
        });
      }

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: { repositoryId: repo.id, repositorySlug: slug, ownerUsername: user.username },
      });

      // ── Step 3: Clone repository (5–60%) ──
      await this.updateProgress(jobId, ImportJobStatus.CLONING, 6, 'Cloning repository...');

      const cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repoName}.git`;
      await this.gitService.cloneFromUrl(user.username, slug, cloneUrl, async (percent) => {
        await this.updateProgress(jobId, ImportJobStatus.CLONING, percent, 'Cloning repository...');
      });

      await this.updateProgress(jobId, ImportJobStatus.CLONING, 60, 'Clone complete');

      // ── Step 4: Seed branches (60–65%) ──
      await this.updateProgress(
        jobId,
        ImportJobStatus.SEEDING_BRANCHES,
        61,
        'Importing branches...',
      );

      const branches = await this.gitService.getLocalBranchesWithSha(user.username, slug);
      if (branches.length > 0) {
        await this.prisma.branch.createMany({
          data: branches.map((b) => ({
            repositoryId: repo.id,
            name: b.name,
            headCommitSha: b.sha || null,
            isProtected: b.name === (githubRepo.default_branch ?? 'main'),
          })),
          skipDuplicates: true,
        });
      }

      await this.updateProgress(
        jobId,
        ImportJobStatus.SEEDING_BRANCHES,
        65,
        `${branches.length} branches imported`,
      );

      // ── Step 5: Import labels (65–70%) ──
      await this.updateProgress(jobId, ImportJobStatus.IMPORTING_LABELS, 66, 'Importing labels...');

      const labelMap = new Map<string, string>(); // GitHub label name → SpectraGit label ID
      try {
        const ghLabels = await this.fetchAllPages<GHLabel>(octokit, 'issues', 'listLabelsForRepo', {
          owner,
          repo: repoName,
        });
        for (const gl of ghLabels) {
          const label = await this.prisma.label.upsert({
            where: {
              repositoryId_name: { repositoryId: repo.id, name: String(gl.name).slice(0, 50) },
            },
            create: {
              repositoryId: repo.id,
              name: String(gl.name).slice(0, 50),
              color: `#${gl.color}`,
              description: gl.description?.slice(0, 200) ?? null,
            },
            update: {},
          });
          labelMap.set(gl.name, label.id);
        }
      } catch (e) {
        this.logger.warn(`Labels import partial failure: ${(e as Error).message}`);
      }

      await this.updateProgress(
        jobId,
        ImportJobStatus.IMPORTING_LABELS,
        70,
        `${labelMap.size} labels imported`,
      );

      // ── Step 6: Import milestones (70–75%) ──
      await this.updateProgress(
        jobId,
        ImportJobStatus.IMPORTING_MILESTONES,
        71,
        'Importing milestones...',
      );

      const milestoneMap = new Map<number, string>(); // GitHub milestone number → SpectraGit ID
      try {
        const ghMilestones = await this.fetchAllPages<GHMilestone>(
          octokit,
          'issues',
          'listMilestones',
          {
            owner,
            repo: repoName,
            state: 'all' as const,
          },
        );
        for (const gm of ghMilestones) {
          const milestone = await this.prisma.milestone.upsert({
            where: {
              repositoryId_title: { repositoryId: repo.id, title: String(gm.title).slice(0, 255) },
            },
            create: {
              repositoryId: repo.id,
              title: String(gm.title).slice(0, 255),
              description: gm.description?.slice(0, 500) ?? null,
              dueDate: gm.due_on ? new Date(gm.due_on) : null,
            },
            update: {},
          });
          milestoneMap.set(gm.number, milestone.id);
        }
      } catch (e) {
        this.logger.warn(`Milestones import partial failure: ${(e as Error).message}`);
      }

      await this.updateProgress(
        jobId,
        ImportJobStatus.IMPORTING_MILESTONES,
        75,
        `${milestoneMap.size} milestones imported`,
      );

      // ── Step 7: Import issues (75–88%) ──
      await this.updateProgress(jobId, ImportJobStatus.IMPORTING_ISSUES, 76, 'Importing issues...');

      let issueCount = 0;
      try {
        const ghIssues = await this.fetchAllPages<GHIssue>(octokit, 'issues', 'listForRepo', {
          owner,
          repo: repoName,
          state: 'all' as const,
          per_page: 100,
        });

        // Get current max issue number for this repo
        const maxIssue = await this.prisma.issue.findFirst({
          where: { repositoryId: repo.id },
          orderBy: { number: 'desc' },
          select: { number: true },
        });
        let nextNumber = (maxIssue?.number ?? 0) + 1;

        for (const gi of ghIssues) {
          // Skip pull requests (GitHub returns PRs in issues endpoint)
          if (gi.pull_request) continue;

          const ghExtId = String(gi.number);
          const existing = await this.prisma.issue.findFirst({
            where: { repositoryId: repo.id, githubExternalId: ghExtId },
          });
          if (existing) continue;

          const issue = await this.prisma.issue.create({
            data: {
              repositoryId: repo.id,
              authorId: userId,
              number: nextNumber++,
              title: String(gi.title).slice(0, 255),
              body: gi.body ?? null,
              status: gi.state === 'open' ? IssueStatus.OPEN : IssueStatus.CLOSED,
              milestoneId: gi.milestone ? (milestoneMap.get(gi.milestone.number) ?? null) : null,
              githubExternalId: ghExtId,
            },
          });

          // Link labels
          if (gi.labels && gi.labels.length > 0) {
            for (const l of gi.labels) {
              const labelName = typeof l === 'string' ? l : l.name;
              if (labelName && labelMap.has(labelName)) {
                await this.prisma.issueLabel
                  .create({
                    data: { issueId: issue.id, labelId: labelMap.get(labelName)! },
                  })
                  .catch(() => {}); // skip duplicates
              }
            }
          }

          // Import issue comments
          if (gi.comments > 0) {
            try {
              const comments = await this.fetchAllPages<GHComment>(
                octokit,
                'issues',
                'listComments',
                {
                  owner,
                  repo: repoName,
                  issue_number: gi.number,
                },
              );
              for (const c of comments) {
                await this.prisma.comment
                  .create({
                    data: {
                      authorId: userId,
                      type: CommentType.ISSUE,
                      issueId: issue.id,
                      body: c.body ?? '',
                    },
                  })
                  .catch(() => {});
              }
            } catch {
              // Non-critical: continue
            }
          }

          issueCount++;
          const issueProgress = Math.round(76 + (issueCount / Math.max(ghIssues.length, 1)) * 12);
          await this.updateProgress(
            jobId,
            ImportJobStatus.IMPORTING_ISSUES,
            Math.min(issueProgress, 88),
            `Importing issues (${issueCount})...`,
          );
        }
      } catch (e) {
        this.logger.warn(`Issues import partial failure: ${(e as Error).message}`);
      }

      await this.updateProgress(
        jobId,
        ImportJobStatus.IMPORTING_ISSUES,
        88,
        `${issueCount} issues imported`,
      );

      // ── Step 8: Import pull requests (88–96%) ──
      await this.updateProgress(
        jobId,
        ImportJobStatus.IMPORTING_PRS,
        89,
        'Importing pull requests...',
      );

      let prCount = 0;
      try {
        const ghPRs = await this.fetchAllPages<GHPullRequest>(octokit, 'pulls', 'list', {
          owner,
          repo: repoName,
          state: 'all' as const,
          per_page: 100,
        });

        const maxPR = await this.prisma.pullRequest.findFirst({
          where: { repositoryId: repo.id },
          orderBy: { number: 'desc' },
          select: { number: true },
        });
        let nextPRNumber = (maxPR?.number ?? 0) + 1;

        for (const gp of ghPRs) {
          const ghExtId = String(gp.number);
          const existing = await this.prisma.pullRequest.findFirst({
            where: { repositoryId: repo.id, githubExternalId: ghExtId },
          });
          if (existing) continue;

          let status: PRStatus = PRStatus.OPEN;
          if (gp.merged_at) {
            status = PRStatus.MERGED;
          } else if (gp.state === 'closed') {
            status = PRStatus.CLOSED;
          }

          const pr = await this.prisma.pullRequest.create({
            data: {
              repositoryId: repo.id,
              authorId: userId,
              number: nextPRNumber++,
              sourceBranch: gp.head?.ref ?? 'unknown',
              targetBranch: gp.base?.ref ?? 'main',
              title: String(gp.title).slice(0, 255),
              body: gp.body ?? null,
              status,
              mergedAt: gp.merged_at ? new Date(gp.merged_at) : null,
              githubExternalId: ghExtId,
            },
          });

          // Link PR labels
          if (gp.labels && gp.labels.length > 0) {
            for (const l of gp.labels) {
              const labelName = typeof l === 'string' ? l : l.name;
              if (labelName && labelMap.has(labelName)) {
                await this.prisma.pRLabel
                  .create({
                    data: { pullRequestId: pr.id, labelId: labelMap.get(labelName)! },
                  })
                  .catch(() => {});
              }
            }
          }

          // Import PR comments
          try {
            const comments = await this.fetchAllPages<GHComment>(
              octokit,
              'issues',
              'listComments',
              {
                owner,
                repo: repoName,
                issue_number: gp.number,
              },
            );
            for (const c of comments) {
              await this.prisma.comment
                .create({
                  data: {
                    authorId: userId,
                    type: CommentType.PULL_REQUEST,
                    pullRequestId: pr.id,
                    body: c.body ?? '',
                  },
                })
                .catch(() => {});
            }
          } catch {
            // Non-critical
          }

          prCount++;
          const prProgress = Math.round(89 + (prCount / Math.max(ghPRs.length, 1)) * 7);
          await this.updateProgress(
            jobId,
            ImportJobStatus.IMPORTING_PRS,
            Math.min(prProgress, 96),
            `Importing PRs (${prCount})...`,
          );
        }
      } catch (e) {
        this.logger.warn(`PRs import partial failure: ${(e as Error).message}`);
      }

      await this.updateProgress(
        jobId,
        ImportJobStatus.IMPORTING_PRS,
        96,
        `${prCount} pull requests imported`,
      );

      // ── Step 9: Import tags (96–99%) ──
      await this.updateProgress(jobId, ImportJobStatus.IMPORTING_TAGS, 97, 'Importing tags...');

      let tagCount = 0;
      try {
        const diskTags = await this.gitService.getTags(user.username, slug);
        for (const tagName of diskTags) {
          const sha = await this.gitService.getHeadCommitSha(user.username, slug, tagName);
          if (sha) {
            await this.prisma.tag.upsert({
              where: { repositoryId_name: { repositoryId: repo.id, name: tagName } },
              create: {
                repositoryId: repo.id,
                name: tagName,
                commitSha: sha,
              },
              update: {},
            });
            tagCount++;
          }
        }
      } catch (e) {
        this.logger.warn(`Tags import partial failure: ${(e as Error).message}`);
      }

      await this.updateProgress(
        jobId,
        ImportJobStatus.IMPORTING_TAGS,
        99,
        `${tagCount} tags imported`,
      );

      // ── Step 10: Complete ──
      await this.updateProgress(jobId, ImportJobStatus.COMPLETED, 100, 'Import complete!');

      this.logger.log(`Import complete: ${githubRepoFullName} → ${user.username}/${slug}`);
      return { success: true, repositorySlug: slug, ownerUsername: user.username };
    } catch (error) {
      const msg = (error as Error).message ?? 'Unknown error';
      this.logger.error(`Import failed for ${githubRepoFullName}: ${msg}`, (error as Error).stack);

      await this.prisma.importJob
        .update({
          where: { id: jobId },
          data: {
            status: ImportJobStatus.FAILED,
            error: msg.slice(0, 2000),
            currentStep: 'Import failed',
          },
        })
        .catch(() => {});

      throw error;
    }
  }

  private async updateProgress(
    jobId: string,
    status: ImportJobStatus,
    progress: number,
    currentStep: string,
  ): Promise<void> {
    await this.prisma.importJob
      .update({
        where: { id: jobId },
        data: { status, progress, currentStep },
      })
      .catch((e) => {
        this.logger.warn(`Failed to update import progress: ${(e as Error).message}`);
      });
  }

  /**
   * Generic paginated fetcher for Octokit endpoints.
   */
  private async fetchAllPages<T>(
    octokit: Octokit,
    namespace: string,
    method: string,
    params: Record<string, unknown>,
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    const perPage = (params.per_page as number) || 100;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const ns = octokit[namespace as keyof Octokit] as Record<
        string,
        (...args: unknown[]) => Promise<{ data: T[] }>
      >;
      const { data } = await ns[method]({ ...params, per_page: perPage, page });
      if (!Array.isArray(data) || data.length === 0) break;
      results.push(...data);
      if (data.length < perPage) break;
      page++;
    }

    return results;
  }
}
