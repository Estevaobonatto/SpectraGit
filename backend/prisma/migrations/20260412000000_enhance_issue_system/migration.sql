-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('BUG', 'FEATURE', 'QUESTION', 'SUPPORT', 'IMPROVEMENT');

-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "IssueCloseReason" AS ENUM ('FIXED', 'DUPLICATE', 'NOT_REPRODUCIBLE', 'NOT_PLANNED', 'OBSOLETE');

-- AlterEnum
ALTER TYPE "IssueStatus" ADD VALUE 'TRIAGE';
ALTER TYPE "IssueStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "IssueStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "IssueStatus" ADD VALUE 'BLOCKED';
ALTER TYPE "IssueStatus" ADD VALUE 'WAITING_USER';
ALTER TYPE "IssueStatus" ADD VALUE 'RESOLVED';
ALTER TYPE "IssueStatus" ADD VALUE 'WONT_FIX';

-- AlterTable
ALTER TABLE "issues" ADD COLUMN "type" "IssueType";
ALTER TABLE "issues" ADD COLUMN "priority" "IssuePriority";
ALTER TABLE "issues" ADD COLUMN "close_reason" "IssueCloseReason";
ALTER TABLE "issues" ADD COLUMN "close_reason_note" TEXT;
ALTER TABLE "issues" ADD COLUMN "assigned_area" VARCHAR(100);
ALTER TABLE "issues" ADD COLUMN "tech_context" JSONB;
ALTER TABLE "issues" ADD COLUMN "form_data" JSONB;

-- CreateIndex
CREATE INDEX "issues_repository_id_status_idx" ON "issues"("repository_id", "status");

-- CreateIndex
CREATE INDEX "issues_repository_id_type_idx" ON "issues"("repository_id", "type");
