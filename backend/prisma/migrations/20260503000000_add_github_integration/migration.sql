-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'CLONING', 'SEEDING_BRANCHES', 'IMPORTING_LABELS', 'IMPORTING_MILESTONES', 'IMPORTING_ISSUES', 'IMPORTING_PRS', 'IMPORTING_TAGS', 'COMPLETED', 'FAILED');

-- AlterTable: repositories — add GitHub linkage & sync fields
ALTER TABLE "repositories" ADD COLUMN "github_external_id" VARCHAR(255);
ALTER TABLE "repositories" ADD COLUMN "github_repo_full_name" VARCHAR(255);
ALTER TABLE "repositories" ADD COLUMN "github_webhook_secret" VARCHAR(255);
ALTER TABLE "repositories" ADD COLUMN "mirror_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "repositories" ADD COLUMN "last_synced_at" TIMESTAMP(3);
ALTER TABLE "repositories" ADD COLUMN "sync_etag" VARCHAR(255);

-- AlterTable: issues — add GitHub sync fields
ALTER TABLE "issues" ADD COLUMN "github_external_id" VARCHAR(255);
ALTER TABLE "issues" ADD COLUMN "synced_at" TIMESTAMP(3);
CREATE INDEX "issues_repository_id_github_external_id_idx" ON "issues"("repository_id", "github_external_id");

-- AlterTable: labels — add GitHub sync fields
ALTER TABLE "labels" ADD COLUMN "github_external_id" VARCHAR(255);
ALTER TABLE "labels" ADD COLUMN "synced_at" TIMESTAMP(3);
CREATE INDEX "labels_repository_id_github_external_id_idx" ON "labels"("repository_id", "github_external_id");

-- AlterTable: milestones — add GitHub sync fields
ALTER TABLE "milestones" ADD COLUMN "github_external_id" VARCHAR(255);
ALTER TABLE "milestones" ADD COLUMN "synced_at" TIMESTAMP(3);
CREATE INDEX "milestones_repository_id_github_external_id_idx" ON "milestones"("repository_id", "github_external_id");

-- AlterTable: pull_requests — add GitHub sync fields
ALTER TABLE "pull_requests" ADD COLUMN "github_external_id" VARCHAR(255);
ALTER TABLE "pull_requests" ADD COLUMN "synced_at" TIMESTAMP(3);
CREATE INDEX "pull_requests_repository_id_github_external_id_idx" ON "pull_requests"("repository_id", "github_external_id");

-- AlterTable: releases — add GitHub sync fields
ALTER TABLE "releases" ADD COLUMN "github_external_id" VARCHAR(255);
ALTER TABLE "releases" ADD COLUMN "synced_at" TIMESTAMP(3);
CREATE INDEX "releases_github_external_id_idx" ON "releases"("github_external_id");

-- AlterTable: reviews — add GitHub sync fields
ALTER TABLE "reviews" ADD COLUMN "github_external_id" VARCHAR(255);
ALTER TABLE "reviews" ADD COLUMN "synced_at" TIMESTAMP(3);
CREATE INDEX "reviews_github_external_id_idx" ON "reviews"("github_external_id");

-- AlterTable: comments — add GitHub sync fields
ALTER TABLE "comments" ADD COLUMN "github_external_id" VARCHAR(255);
ALTER TABLE "comments" ADD COLUMN "synced_at" TIMESTAMP(3);
CREATE INDEX "comments_github_external_id_idx" ON "comments"("github_external_id");

-- CreateTable: import_jobs
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "repository_id" UUID,
    "github_repo_full_name" VARCHAR(255) NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "current_step" VARCHAR(255),
    "error" TEXT,
    "repository_slug" VARCHAR(100),
    "owner_username" VARCHAR(39),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "import_jobs_user_id_idx" ON "import_jobs"("user_id");
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");

ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: github_webhook_events
CREATE TABLE "github_webhook_events" (
    "id" UUID NOT NULL,
    "repository_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "delivery_id" VARCHAR(255) NOT NULL,
    "payload" JSON NOT NULL,
    "signature" VARCHAR(255),
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "github_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "github_webhook_events_delivery_id_key" ON "github_webhook_events"("delivery_id");
CREATE INDEX "github_webhook_events_repository_id_idx" ON "github_webhook_events"("repository_id");
CREATE INDEX "github_webhook_events_event_type_idx" ON "github_webhook_events"("event_type");
CREATE INDEX "github_webhook_events_processed_idx" ON "github_webhook_events"("processed");
CREATE INDEX "github_webhook_events_created_at_idx" ON "github_webhook_events"("created_at");

-- CreateTable: github_sync_state
CREATE TABLE "github_sync_state" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "resource_sub_id" VARCHAR(255),
    "etag" VARCHAR(255),
    "last_modified" VARCHAR(255),
    "synced_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_sync_state_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "github_sync_state_repository_id_resource_type_resource_sub_id_key" ON "github_sync_state"("repository_id", "resource_type", "resource_sub_id");
CREATE INDEX "github_sync_state_repository_id_idx" ON "github_sync_state"("repository_id");

ALTER TABLE "github_sync_state" ADD CONSTRAINT "github_sync_state_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
