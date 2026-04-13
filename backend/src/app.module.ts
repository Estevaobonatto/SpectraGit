import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RepositoriesModule } from './modules/repositories/repositories.module';
import { GitModule } from './modules/git/git.module';
import { CommitsModule } from './modules/commits/commits.module';
import { BranchesModule } from './modules/branches/branches.module';
import { TagsModule } from './modules/tags/tags.module';
import { ReleasesModule } from './modules/releases/releases.module';
import { IssuesModule } from './modules/issues/issues.module';
import { PullRequestsModule } from './modules/pull-requests/pull-requests.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AuditModule } from './modules/audit/audit.module';
import { EventsModule } from './events/events.module';
import { JobsModule } from './jobs/jobs.module';
import { PatModule } from './modules/auth/pat/pat.module';
import { ActivityModule } from './modules/activity/activity.module';
import { SetupModule } from './modules/setup/setup.module';
import { AdminModule } from './modules/admin/admin.module';
import { CollaboratorsModule } from './modules/collaborators/collaborators.module';
import { WikiModule } from './modules/wiki/wiki.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('redis.host'),
          port: config.get('redis.port'),
          password: config.get('redis.password'),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RepositoriesModule,
    GitModule,
    CommitsModule,
    BranchesModule,
    TagsModule,
    ReleasesModule,
    IssuesModule,
    PullRequestsModule,
    ReviewsModule,
    NotificationsModule,
    OrganizationsModule,
    IntegrationsModule,
    AuditModule,
    EventsModule,
    JobsModule,
    PatModule,
    ActivityModule,
    SetupModule,
    AdminModule,
    CollaboratorsModule,
    WikiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
