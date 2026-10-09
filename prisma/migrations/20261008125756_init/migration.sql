-- CreateTable
CREATE TABLE "creators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "completedStep" INTEGER NOT NULL DEFAULT 0,
    "legalName" TEXT,
    "dateOfBirth" TEXT,
    "country" TEXT,
    "idType" TEXT,
    "idFileName" TEXT,
    "idBackFileName" TEXT,
    "idQualityWarning" BOOLEAN NOT NULL DEFAULT false,
    "selfieCaptured" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "verifications_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "videoFileName" TEXT NOT NULL,
    "videoSizeBytes" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "views" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "content_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "buyerCountry" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchases_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "creators_email_key" ON "creators"("email");

-- CreateIndex
CREATE INDEX "sessions_creatorId_idx" ON "sessions"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_creatorId_key" ON "verifications"("creatorId");

-- CreateIndex
CREATE INDEX "content_creatorId_deletedAt_idx" ON "content"("creatorId", "deletedAt");

-- CreateIndex
CREATE INDEX "content_status_scheduledAt_idx" ON "content"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "purchases_contentId_createdAt_idx" ON "purchases"("contentId", "createdAt");
