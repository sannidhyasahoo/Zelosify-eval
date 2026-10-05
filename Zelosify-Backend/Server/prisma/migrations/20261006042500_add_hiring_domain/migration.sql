-- CreateEnum
CREATE TYPE "OpeningStatus" AS ENUM ('OPEN', 'CLOSED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('SUBMITTED', 'SHORTLISTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Opening" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "contractType" TEXT,
    "hiringManagerId" TEXT NOT NULL,
    "experienceMin" INTEGER NOT NULL,
    "experienceMax" INTEGER,
    "requiredSkills" JSONB NOT NULL,
    "postedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedCompletionDate" TIMESTAMP(3),
    "actionDate" TIMESTAMP(3),
    "status" "OpeningStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "Opening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringProfile" (
    "id" SERIAL NOT NULL,
    "openingId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ProfileStatus" NOT NULL DEFAULT 'SUBMITTED',
    "shortlistedBy" TEXT,
    "shortlistedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "recommended" BOOLEAN,
    "recommendationScore" DOUBLE PRECISION,
    "recommendationReason" TEXT,
    "recommendationLatencyMs" INTEGER,
    "recommendationVersion" TEXT,
    "recommendationConfidence" DOUBLE PRECISION,
    "recommendedAt" TIMESTAMP(3),
    "recommendationStatus" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HiringProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Opening_tenantId_idx" ON "Opening"("tenantId");

-- CreateIndex
CREATE INDEX "Opening_hiringManagerId_idx" ON "Opening"("hiringManagerId");

-- CreateIndex
CREATE UNIQUE INDEX "HiringProfile_s3Key_key" ON "HiringProfile"("s3Key");

-- CreateIndex
CREATE INDEX "HiringProfile_openingId_idx" ON "HiringProfile"("openingId");

-- CreateIndex
CREATE INDEX "HiringProfile_recommended_idx" ON "HiringProfile"("recommended");

-- CreateIndex
CREATE INDEX "HiringProfile_recommendationStatus_idx" ON "HiringProfile"("recommendationStatus");

-- AddForeignKey
ALTER TABLE "Opening" ADD CONSTRAINT "Opening_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opening" ADD CONSTRAINT "Opening_hiringManagerId_fkey" FOREIGN KEY ("hiringManagerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringProfile" ADD CONSTRAINT "HiringProfile_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "Opening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
