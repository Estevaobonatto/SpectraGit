-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('SYSTEM_ADMIN', 'USER');

-- CreateTable: instance_settings (singleton for self-hosted configuration)
CREATE TABLE "instance_settings" (
    "id" VARCHAR(10) NOT NULL DEFAULT 'singleton',
    "app_name" VARCHAR(100) NOT NULL DEFAULT 'SpectraGit',
    "app_logo_url" VARCHAR(512),
    "primary_color" VARCHAR(7) NOT NULL DEFAULT '#7C3AED',
    "base_url" VARCHAR(512) NOT NULL DEFAULT 'http://localhost',
    "smtp_host" VARCHAR(255),
    "smtp_port" INTEGER,
    "smtp_user" VARCHAR(255),
    "smtp_from_email" VARCHAR(255),
    "encrypted_smtp_password" TEXT,
    "is_setup_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instance_settings_pkey" PRIMARY KEY ("id")
);

-- AlterTable: users -- add password_hash, system_role, is_disabled
ALTER TABLE "users" ADD COLUMN "password_hash" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN "system_role" "SystemRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ADD COLUMN "is_disabled" BOOLEAN NOT NULL DEFAULT false;
