-- CreateEnum
CREATE TYPE "WikiSourceMode" AS ENUM ('PLATFORM', 'REPOSITORY', 'HYBRID');

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'WIKI_PAGE_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'WIKI_PAGE_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'WIKI_PAGE_DELETED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WIKI_PAGE_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'WIKI_PAGE_UPDATED';

-- CreateTable
CREATE TABLE "wiki_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "repository_id" UUID NOT NULL,
    "source_mode" "WikiSourceMode" NOT NULL DEFAULT 'PLATFORM',
    "source_branch" VARCHAR(255) NOT NULL DEFAULT 'main',
    "source_root" VARCHAR(500) NOT NULL DEFAULT '/docs',
    "home_page" VARCHAR(255) NOT NULL DEFAULT 'Home',
    "allow_comments" BOOLEAN NOT NULL DEFAULT true,
    "allow_attachments" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "repository_id" UUID NOT NULL,
    "slug" VARCHAR(500) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "parent_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_page_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "editor_id" UUID NOT NULL,
    "message" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiki_page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wiki_settings_repository_id_key" ON "wiki_settings"("repository_id");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_pages_repository_id_slug_key" ON "wiki_pages"("repository_id", "slug");

-- CreateIndex
CREATE INDEX "wiki_pages_repository_id_parent_id_idx" ON "wiki_pages"("repository_id", "parent_id");

-- CreateIndex
CREATE INDEX "wiki_pages_repository_id_sort_order_idx" ON "wiki_pages"("repository_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_page_versions_page_id_version_key" ON "wiki_page_versions"("page_id", "version");

-- CreateIndex
CREATE INDEX "wiki_page_versions_page_id_created_at_idx" ON "wiki_page_versions"("page_id", "created_at");

-- CreateIndex
CREATE INDEX "wiki_comments_page_id_created_at_idx" ON "wiki_comments"("page_id", "created_at");

-- AddForeignKey
ALTER TABLE "wiki_settings" ADD CONSTRAINT "wiki_settings_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "wiki_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_page_versions" ADD CONSTRAINT "wiki_page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "wiki_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_page_versions" ADD CONSTRAINT "wiki_page_versions_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_comments" ADD CONSTRAINT "wiki_comments_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "wiki_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_comments" ADD CONSTRAINT "wiki_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
