import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GitService } from '../git/git.service';
import { UpdateProfileCustomizationDto } from './dto/update-profile-customization.dto';
import { CreateProfileSectionDto, UpdateProfileSectionDto } from './dto/profile-section.dto';
import { CreateSocialLinkDto, UpdateSocialLinkDto } from './dto/social-link.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { CreateProfileProjectDto, UpdateProfileProjectDto } from './dto/profile-project.dto';
import { PinRepositoryDto } from './dto/pin-repository.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly git: GitService,
  ) {}

  private async ensureProfile(userId: string) {
    let profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.prisma.userProfile.create({ data: { userId } });
    }
    return profile;
  }

  // ── Full Profile (public) ─────────────────────────────────

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        website: true,
        createdAt: true,
        profile: {
          include: {
            sections: { where: { isVisible: true }, orderBy: { sortOrder: 'asc' } },
            socialLinks: { orderBy: { sortOrder: 'asc' } },
            pinnedRepos: {
              orderBy: { sortOrder: 'asc' },
              include: {
                repository: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    visibility: true,
                    topics: true,
                    ownerUserId: true,
                    ownerOrgId: true,
                    updatedAt: true,
                    ownerUser: { select: { username: true } },
                    ownerOrg: { select: { name: true } },
                  },
                },
              },
            },
            skills: { orderBy: { sortOrder: 'asc' } },
            projects: { orderBy: { sortOrder: 'asc' } },
          },
        },
        _count: { select: { ownedRepos: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Filter pinned repos to only show PUBLIC ones to non-owners
    if (user.profile?.pinnedRepos) {
      user.profile.pinnedRepos = user.profile.pinnedRepos.filter(
        (pr) => pr.repository.visibility === 'PUBLIC',
      );
    }

    return user;
  }

  async getMyProfile(userId: string) {
    const profile = await this.ensureProfile(userId);
    return this.prisma.userProfile.findUnique({
      where: { id: profile.id },
      include: {
        sections: { orderBy: { sortOrder: 'asc' } },
        socialLinks: { orderBy: { sortOrder: 'asc' } },
        pinnedRepos: {
          orderBy: { sortOrder: 'asc' },
          include: {
            repository: {
              select: { id: true, name: true, slug: true, description: true, visibility: true },
            },
          },
        },
        skills: { orderBy: { sortOrder: 'asc' } },
        projects: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  // ── Profile Customization ────────────────────────────────

  async updateCustomization(userId: string, dto: UpdateProfileCustomizationDto) {
    const profile = await this.ensureProfile(userId);

    // Sanitize custom CSS - block dangerous properties
    if (dto.customCss) {
      const forbidden = [
        'position:\\s*fixed',
        'position:\\s*absolute',
        'z-index',
        'javascript:',
        'expression\\(',
        'url\\((?!data:image)',
      ];
      for (const pattern of forbidden) {
        if (new RegExp(pattern, 'i').test(dto.customCss)) {
          throw new BadRequestException(`Custom CSS contains forbidden pattern: ${pattern}`);
        }
      }
    }

    return this.prisma.userProfile.update({
      where: { id: profile.id },
      data: dto,
    });
  }

  // ── Sections ─────────────────────────────────────────────

  async createSection(userId: string, dto: CreateProfileSectionDto) {
    const profile = await this.ensureProfile(userId);
    return this.prisma.userProfileSection.create({
      data: { profileId: profile.id, ...dto },
    });
  }

  async updateSection(userId: string, sectionId: string, dto: UpdateProfileSectionDto) {
    const profile = await this.ensureProfile(userId);
    const section = await this.prisma.userProfileSection.findFirst({
      where: { id: sectionId, profileId: profile.id },
    });
    if (!section) throw new NotFoundException('Section not found');
    return this.prisma.userProfileSection.update({
      where: { id: sectionId },
      data: dto,
    });
  }

  async deleteSection(userId: string, sectionId: string) {
    const profile = await this.ensureProfile(userId);
    const section = await this.prisma.userProfileSection.findFirst({
      where: { id: sectionId, profileId: profile.id },
    });
    if (!section) throw new NotFoundException('Section not found');
    await this.prisma.userProfileSection.delete({ where: { id: sectionId } });
    return { message: 'Section deleted' };
  }

  // ── Social Links ─────────────────────────────────────────

  async createSocialLink(userId: string, dto: CreateSocialLinkDto) {
    const profile = await this.ensureProfile(userId);
    const count = await this.prisma.userSocialLink.count({ where: { profileId: profile.id } });
    if (count >= 20) throw new BadRequestException('Maximum of 20 social links allowed');
    return this.prisma.userSocialLink.create({
      data: { profileId: profile.id, ...dto },
    });
  }

  async updateSocialLink(userId: string, linkId: string, dto: UpdateSocialLinkDto) {
    const profile = await this.ensureProfile(userId);
    const link = await this.prisma.userSocialLink.findFirst({
      where: { id: linkId, profileId: profile.id },
    });
    if (!link) throw new NotFoundException('Social link not found');
    return this.prisma.userSocialLink.update({
      where: { id: linkId },
      data: dto,
    });
  }

  async deleteSocialLink(userId: string, linkId: string) {
    const profile = await this.ensureProfile(userId);
    const link = await this.prisma.userSocialLink.findFirst({
      where: { id: linkId, profileId: profile.id },
    });
    if (!link) throw new NotFoundException('Social link not found');
    await this.prisma.userSocialLink.delete({ where: { id: linkId } });
    return { message: 'Social link deleted' };
  }

  // ── Pinned Repositories ──────────────────────────────────

  async pinRepository(userId: string, dto: PinRepositoryDto) {
    const profile = await this.ensureProfile(userId);
    const count = await this.prisma.userPinnedRepository.count({
      where: { profileId: profile.id },
    });
    if (count >= 6) throw new BadRequestException('Maximum of 6 pinned repositories allowed');

    // Verify the repo belongs to the user
    const repo = await this.prisma.repository.findFirst({
      where: { id: dto.repositoryId, ownerUserId: userId },
    });
    if (!repo) throw new NotFoundException('Repository not found or not owned by you');

    return this.prisma.userPinnedRepository.create({
      data: {
        profileId: profile.id,
        repositoryId: dto.repositoryId,
        sortOrder: dto.sortOrder ?? count,
      },
      include: {
        repository: {
          select: { id: true, name: true, slug: true, description: true, visibility: true },
        },
      },
    });
  }

  async unpinRepository(userId: string, repositoryId: string) {
    const profile = await this.ensureProfile(userId);
    const pin = await this.prisma.userPinnedRepository.findFirst({
      where: { profileId: profile.id, repositoryId },
    });
    if (!pin) throw new NotFoundException('Pinned repository not found');
    await this.prisma.userPinnedRepository.delete({ where: { id: pin.id } });
    return { message: 'Repository unpinned' };
  }

  // ── Skills ───────────────────────────────────────────────

  async createSkill(userId: string, dto: CreateSkillDto) {
    const profile = await this.ensureProfile(userId);
    const count = await this.prisma.userSkill.count({ where: { profileId: profile.id } });
    if (count >= 50) throw new BadRequestException('Maximum of 50 skills allowed');
    return this.prisma.userSkill.create({
      data: { profileId: profile.id, ...dto },
    });
  }

  async updateSkill(userId: string, skillId: string, dto: UpdateSkillDto) {
    const profile = await this.ensureProfile(userId);
    const skill = await this.prisma.userSkill.findFirst({
      where: { id: skillId, profileId: profile.id },
    });
    if (!skill) throw new NotFoundException('Skill not found');
    return this.prisma.userSkill.update({
      where: { id: skillId },
      data: dto,
    });
  }

  async deleteSkill(userId: string, skillId: string) {
    const profile = await this.ensureProfile(userId);
    const skill = await this.prisma.userSkill.findFirst({
      where: { id: skillId, profileId: profile.id },
    });
    if (!skill) throw new NotFoundException('Skill not found');
    await this.prisma.userSkill.delete({ where: { id: skillId } });
    return { message: 'Skill deleted' };
  }

  // ── Projects ─────────────────────────────────────────────

  async createProject(userId: string, dto: CreateProfileProjectDto) {
    const profile = await this.ensureProfile(userId);
    const count = await this.prisma.userProfileProject.count({ where: { profileId: profile.id } });
    if (count >= 20) throw new BadRequestException('Maximum of 20 projects allowed');
    return this.prisma.userProfileProject.create({
      data: { profileId: profile.id, ...dto },
    });
  }

  async updateProject(userId: string, projectId: string, dto: UpdateProfileProjectDto) {
    const profile = await this.ensureProfile(userId);
    const project = await this.prisma.userProfileProject.findFirst({
      where: { id: projectId, profileId: profile.id },
    });
    if (!project) throw new NotFoundException('Project not found');
    return this.prisma.userProfileProject.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async deleteProject(userId: string, projectId: string) {
    const profile = await this.ensureProfile(userId);
    const project = await this.prisma.userProfileProject.findFirst({
      where: { id: projectId, profileId: profile.id },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.prisma.userProfileProject.delete({ where: { id: projectId } });
    return { message: 'Project deleted' };
  }

  // ── Language Stats (computed from git file extensions) ──

  async getLanguageStats(username: string, viewerUserId?: string) {
    // Resolve the user id first so we can determine ownership
    const userIdRow = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!userIdRow) throw new NotFoundException('User not found');

    const isOwner = !!viewerUserId && viewerUserId === userIdRow.id;

    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        ownedRepos: {
          where: isOwner ? undefined : { visibility: 'PUBLIC' },
          select: { id: true, slug: true, defaultBranch: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Aggregate language bytes from all public repos via git ls-tree
    const totalByLanguage: Record<string, number> = {};
    await Promise.all(
      user.ownedRepos.map(async (repo) => {
        try {
          const breakdown = await this.git.getLanguageBreakdown(
            user.username,
            repo.slug,
            repo.defaultBranch,
          );
          for (const [lang, bytes] of Object.entries(breakdown)) {
            totalByLanguage[lang] = (totalByLanguage[lang] || 0) + bytes;
          }
        } catch {
          // Repo may be empty – skip
        }
      }),
    );

    const grandTotal = Object.values(totalByLanguage).reduce((a, b) => a + b, 0);
    const stats = Object.entries(totalByLanguage)
      .map(([language, bytes]) => ({
        language,
        bytes,
        percentage: grandTotal > 0 ? Math.round((bytes / grandTotal) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes);

    return { languages: stats, totalRepos: user.ownedRepos.length };
  }

  // ── Commit Activity Heatmap ──────────────────────────────

  async getCommitHeatmap(username: string, viewerUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const isOwner = !!viewerUserId && viewerUserId === user.id;

    // Fetch all repos the viewer is allowed to see
    const repos = await this.prisma.repository.findMany({
      where: {
        OR: [{ ownerUserId: user.id }, { ownerOrg: { members: { some: { userId: user.id } } } }],
        ...(isOwner ? {} : { visibility: 'PUBLIC' }),
      },
      select: {
        slug: true,
        ownerUser: { select: { username: true } },
        ownerOrg: { select: { name: true } },
      },
    });

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const startDateStr = oneYearAgo.toISOString().split('T')[0];
    const endDateStr = new Date().toISOString().split('T')[0];

    // Aggregate commit dates from git history across all repos
    const heatmap: Record<string, number> = {};
    await Promise.all(
      repos.map(async (repo) => {
        const ownerName = repo.ownerUser?.username ?? repo.ownerOrg?.name;
        if (!ownerName) return;
        try {
          const dates = await this.git.getCommitDatesByAuthor(
            ownerName,
            repo.slug,
            user.email,
            365,
          );
          for (const day of dates) {
            heatmap[day] = (heatmap[day] || 0) + 1;
          }
        } catch {
          // Repo may be empty or not on disk – skip
        }
      }),
    );

    const totalContributions = Object.values(heatmap).reduce((a, b) => a + b, 0);

    return {
      heatmap,
      totalContributions,
      startDate: startDateStr,
      endDate: endDateStr,
    };
  }
}
