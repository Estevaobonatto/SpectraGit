-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "readme_content" TEXT,
    "about_me" TEXT,
    "background_type" VARCHAR(20) NOT NULL DEFAULT 'solid',
    "background_color" VARCHAR(20),
    "background_image" VARCHAR(512),
    "custom_css" TEXT,
    "commit_chart_color" VARCHAR(20),
    "commit_chart_style" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profile_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profile_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_social_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_pinned_repositories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pinned_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "proficiency" INTEGER NOT NULL DEFAULT 50,
    "related_projects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profile_projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "repo_url" VARCHAR(512),
    "live_url" VARCHAR(512),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profile_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_profile_sections_profile_id_sort_order_idx" ON "user_profile_sections"("profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "user_social_links_profile_id_idx" ON "user_social_links"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_pinned_repositories_profile_id_repository_id_key" ON "user_pinned_repositories"("profile_id", "repository_id");

-- CreateIndex
CREATE INDEX "user_pinned_repositories_profile_id_sort_order_idx" ON "user_pinned_repositories"("profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "user_skills_profile_id_idx" ON "user_skills"("profile_id");

-- CreateIndex
CREATE INDEX "user_profile_projects_profile_id_idx" ON "user_profile_projects"("profile_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_sections" ADD CONSTRAINT "user_profile_sections_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_social_links" ADD CONSTRAINT "user_social_links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pinned_repositories" ADD CONSTRAINT "user_pinned_repositories_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pinned_repositories" ADD CONSTRAINT "user_pinned_repositories_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_projects" ADD CONSTRAINT "user_profile_projects_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
