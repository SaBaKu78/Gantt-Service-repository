/*
  Warnings:

  - You are about to drop the column `published` on the `domain_events` table. All the data in the column will be lost.
  - Added the required column `projectId` to the `domain_events` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `domain_events_aggregateType_aggregateId_idx` ON `domain_events`;

-- DropIndex
DROP INDEX `domain_events_eventType_occurredAt_idx` ON `domain_events`;

-- DropIndex
DROP INDEX `domain_events_published_createdAt_idx` ON `domain_events`;

-- AlterTable
ALTER TABLE `domain_events` DROP COLUMN `published`,
    ADD COLUMN `lockToken` VARCHAR(36) NULL,
    ADD COLUMN `lockedUntil` DATETIME(3) NULL,
    ADD COLUMN `nextRetryAt` DATETIME(3) NULL,
    ADD COLUMN `projectId` VARCHAR(64) NOT NULL,
    ADD COLUMN `status` VARCHAR(16) NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `domain_events_status_nextRetryAt_createdAt_idx` ON `domain_events`(`status`, `nextRetryAt`, `createdAt`);

-- CreateIndex
CREATE INDEX `domain_events_projectId_occurredAt_idx` ON `domain_events`(`projectId`, `occurredAt`);
