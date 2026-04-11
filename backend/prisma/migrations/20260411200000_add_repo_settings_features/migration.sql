-- AlterTable: Add new Repository settings fields
ALTER TABLE "repositories" ADD COLUMN "website" VARCHAR(512);
ALTER TABLE "repositories" ADD COLUMN "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "repositories" ADD COLUMN "has_issues_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "repositories" ADD COLUMN "has_prs_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "repositories" ADD COLUMN "has_wiki_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "repositories" ADD COLUMN "allow_merge_commit" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "repositories" ADD COLUMN "allow_squash_merge" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "repositories" ADD COLUMN "allow_rebase_merge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "repositories" ADD COLUMN "auto_delete_branch" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: Branch Protection Rules
CREATE TABLE "branch_protection_rules" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "require_pull_request" BOOLEAN NOT NULL DEFAULT true,
    "required_review_count" INTEGER NOT NULL DEFAULT 1,
    "dismiss_stale_reviews" BOOLEAN NOT NULL DEFAULT false,
    "require_code_owner_review" BOOLEAN NOT NULL DEFAULT false,
    "restrict_pushes" BOOLEAN NOT NULL DEFAULT true,
    "allow_force_pushes" BOOLEAN NOT NULL DEFAULT false,
    "allow_deletions" BOOLEAN NOT NULL DEFAULT false,
    "require_linear_history" BOOLEAN NOT NULL DEFAULT false,
    "lock_branch" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_protection_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branch_protection_rules_branch_id_key" ON "branch_protection_rules"("branch_id");

-- AddForeignKey
ALTER TABLE "branch_protection_rules" ADD CONSTRAINT "branch_protection_rules_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Webhooks
CREATE TABLE "webhooks" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "secret" VARCHAR(255),
    "content_type" VARCHAR(50) NOT NULL DEFAULT 'application/json',
    "events" TEXT[] DEFAULT ARRAY['push']::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_status" INTEGER,
    "last_error" TEXT,
    "last_called_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhooks_repository_id_idx" ON "webhooks"("repository_id");

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
