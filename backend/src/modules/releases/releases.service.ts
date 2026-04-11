import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { PrismaService } from '../../prisma/prisma.service';
import { GitService } from '../git/git.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { CreateReleaseDto } from './dto/create-release.dto';
import { UpdateReleaseDto } from './dto/update-release.dto';
import type { Readable } from 'stream';
import * as path from 'path';
import 'multer';

const releaseInclude = {
  tag: true,
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  assets: {
    select: { id: true, fileName: true, contentType: true, size: true, createdAt: true },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class ReleasesService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gitService: GitService,
    private readonly reposService: RepositoriesService,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('s3.bucket')!;
    this.s3 = new S3Client({
      endpoint: this.configService.get<string>('s3.endpoint'),
      region: this.configService.get<string>('s3.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKeyId')!,
        secretAccessKey: this.configService.get<string>('s3.secretAccessKey')!,
      },
      forcePathStyle: false,
    });
  }

  async list(owner: string, repo: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    return this.prisma.release.findMany({
      where: { repositoryId: repoEntity.id },
      include: releaseInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(owner: string, repo: string, releaseId: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const release = await this.prisma.release.findFirst({
      where: { repositoryId: repoEntity.id, id: releaseId },
      include: releaseInclude,
    });
    if (!release) throw new NotFoundException('Release not found');
    return release;
  }

  async create(owner: string, repo: string, userId: string, dto: CreateReleaseDto) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    // Find or create the tag
    let tag = await this.prisma.tag.findFirst({
      where: { repositoryId: repoEntity.id, name: dto.tagName },
    });

    if (!tag) {
      if (!dto.commitSha) {
        throw new BadRequestException('commitSha is required when creating a new tag');
      }
      // Create the git tag
      await this.gitService.createTag(owner, repo, dto.tagName, dto.commitSha, dto.tagMessage);
      tag = await this.prisma.tag.create({
        data: {
          repositoryId: repoEntity.id,
          name: dto.tagName,
          commitSha: dto.commitSha,
          message: dto.tagMessage ?? null,
        },
      });
    }

    // Check if release already exists for this tag
    const existingRelease = await this.prisma.release.findUnique({
      where: { tagId: tag.id },
    });
    if (existingRelease) throw new ConflictException('A release already exists for this tag');

    return this.prisma.release.create({
      data: {
        repositoryId: repoEntity.id,
        tagId: tag.id,
        name: dto.name,
        body: dto.body ?? null,
        targetBranch: dto.targetBranch ?? repoEntity.defaultBranch,
        isDraft: dto.isDraft ?? false,
        isPrerelease: dto.isPrerelease ?? false,
        authorId: userId,
      },
      include: releaseInclude,
    });
  }

  async update(
    owner: string,
    repo: string,
    releaseId: string,
    userId: string,
    dto: UpdateReleaseDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const release = await this.prisma.release.findFirst({
      where: { repositoryId: repoEntity.id, id: releaseId },
    });
    if (!release) throw new NotFoundException('Release not found');

    return this.prisma.release.update({
      where: { id: release.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.isDraft !== undefined && { isDraft: dto.isDraft }),
        ...(dto.isPrerelease !== undefined && { isPrerelease: dto.isPrerelease }),
        ...(dto.targetBranch !== undefined && { targetBranch: dto.targetBranch }),
      },
      include: releaseInclude,
    });
  }

  async delete(owner: string, repo: string, releaseId: string, userId: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const release = await this.prisma.release.findFirst({
      where: { repositoryId: repoEntity.id, id: releaseId },
      include: { assets: true },
    });
    if (!release) throw new NotFoundException('Release not found');

    // Delete assets from S3
    if (release.assets.length > 0) {
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: release.assets.map((a: { filePath: string }) => ({ Key: a.filePath })),
          },
        }),
      );
    }

    await this.prisma.release.delete({ where: { id: release.id } });

    return { message: 'Release deleted' };
  }

  // ─── Asset management ──────────────────────────────────────

  async uploadAssets(
    owner: string,
    repo: string,
    releaseId: string,
    userId: string,
    files: Array<Express.Multer.File>,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const release = await this.prisma.release.findFirst({
      where: { repositoryId: repoEntity.id, id: releaseId },
    });
    if (!release) throw new NotFoundException('Release not found');

    const assets = [];
    for (const file of files) {
      // Sanitize filename — strip path separators
      const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
      const s3Key = `releases/${release.id}/${safeName}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const asset = await this.prisma.releaseAsset.create({
        data: {
          releaseId: release.id,
          fileName: file.originalname,
          filePath: s3Key,
          contentType: file.mimetype,
          size: file.size,
        },
      });
      assets.push({
        id: asset.id,
        fileName: asset.fileName,
        contentType: asset.contentType,
        size: asset.size,
        createdAt: asset.createdAt,
      });
    }

    return assets;
  }

  async getAsset(owner: string, repo: string, releaseId: string, assetId: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const release = await this.prisma.release.findFirst({
      where: { repositoryId: repoEntity.id, id: releaseId },
    });
    if (!release) throw new NotFoundException('Release not found');

    const asset = await this.prisma.releaseAsset.findFirst({
      where: { id: assetId, releaseId: release.id },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    return asset;
  }

  async getAssetStream(s3Key: string): Promise<Readable> {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      }),
    );
    return response.Body as Readable;
  }

  async deleteAsset(
    owner: string,
    repo: string,
    releaseId: string,
    assetId: string,
    userId: string,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const release = await this.prisma.release.findFirst({
      where: { repositoryId: repoEntity.id, id: releaseId },
    });
    if (!release) throw new NotFoundException('Release not found');

    const asset = await this.prisma.releaseAsset.findFirst({
      where: { id: assetId, releaseId: release.id },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: asset.filePath,
      }),
    );
    await this.prisma.releaseAsset.delete({ where: { id: asset.id } });

    return { message: 'Asset deleted' };
  }
}
