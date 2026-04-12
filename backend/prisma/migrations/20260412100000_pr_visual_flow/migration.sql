-- Migration: PR Visual Flow Improvements
-- Adds new fields and tables for the 20 PR visual/flow features

-- 1. Extend repositories table with PR risk configuration
ALTER TABLE "repositories" ADD COLUMN "pr_risk_config" JSONB;

-- 2. Extend pull_requests table with new visual/flow fields
ALTER TABLE "pull_requests" ADD COLUMN "is_draft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "pull_requests" ADD COLUMN "checklist" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "pull_requests" ADD COLUMN "context_blocks" JSONB;

-- 3. Extend comments table with resolution tracking
ALTER TABLE "comments" ADD COLUMN "resolved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "comments" ADD COLUMN "resolved_by_id" UUID;
ALTER TABLE "comments" ADD CONSTRAINT "comments_resolved_by_id_fkey"
  FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL;

-- 4. Create pull_request_reviewers table
CREATE TABLE "pull_request_reviewers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "pull_request_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pull_request_reviewers_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "pull_request_reviewers"
  ADD CONSTRAINT "pull_request_reviewers_pull_request_id_fkey"
  FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE;

ALTER TABLE "pull_request_reviewers"
  ADD CONSTRAINT "pull_request_reviewers_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "pull_request_reviewers_pull_request_id_user_id_key"
  ON "pull_request_reviewers"("pull_request_id", "user_id");

-- 5. Create pull_request_dependencies table
CREATE TABLE "pull_request_dependencies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "dependent_pr_id" UUID NOT NULL,
  "depends_on_pr_id" UUID NOT NULL,
  "repository_id" UUID NOT NULL,
  CONSTRAINT "pull_request_dependencies_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "pull_request_dependencies"
  ADD CONSTRAINT "pull_request_dependencies_dependent_pr_id_fkey"
  FOREIGN KEY ("dependent_pr_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE;

ALTER TABLE "pull_request_dependencies"
  ADD CONSTRAINT "pull_request_dependencies_depends_on_pr_id_fkey"
  FOREIGN KEY ("depends_on_pr_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "pull_request_dependencies_dependent_pr_id_depends_on_pr_id_key"
  ON "pull_request_dependencies"("dependent_pr_id", "depends_on_pr_id");
