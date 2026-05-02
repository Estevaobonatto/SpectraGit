-- DropForeignKey
ALTER TABLE "pull_request_reviewers" DROP CONSTRAINT "pull_request_reviewers_pull_request_id_fkey";

-- DropForeignKey
ALTER TABLE "pull_request_reviewers" DROP CONSTRAINT "pull_request_reviewers_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pull_request_dependencies" DROP CONSTRAINT "pull_request_dependencies_dependent_pr_id_fkey";

-- DropForeignKey
ALTER TABLE "pull_request_dependencies" DROP CONSTRAINT "pull_request_dependencies_depends_on_pr_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_resolved_by_id_fkey";

-- AlterTable
ALTER TABLE "user_profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "user_profile_sections" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "user_social_links" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "user_pinned_repositories" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "user_skills" ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "related_projects" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "user_profile_projects" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "pull_request_reviewers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "pull_request_dependencies" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "wiki_settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "wiki_pages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "wiki_page_versions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "wiki_comments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pull_request_dependencies" ADD CONSTRAINT "pull_request_dependencies_dependent_pr_id_fkey" FOREIGN KEY ("dependent_pr_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pull_request_dependencies" ADD CONSTRAINT "pull_request_dependencies_depends_on_pr_id_fkey" FOREIGN KEY ("depends_on_pr_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pull_request_reviewers" ADD CONSTRAINT "pull_request_reviewers_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pull_request_reviewers" ADD CONSTRAINT "pull_request_reviewers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

