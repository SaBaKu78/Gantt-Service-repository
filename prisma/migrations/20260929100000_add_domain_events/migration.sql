CREATE TABLE `domain_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `eventType` VARCHAR(64) NOT NULL,
  `aggregateType` VARCHAR(64) NOT NULL,
  `aggregateId` BIGINT UNSIGNED NOT NULL,
  `payload` JSON NOT NULL,
  `occurredAt` DATETIME(3) NOT NULL,
  `published` BOOLEAN NOT NULL DEFAULT false,
  `publishedAt` DATETIME(3) NULL,
  `retryCount` INTEGER NOT NULL DEFAULT 0,
  `lastError` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `domain_events_aggregateType_aggregateId_idx` (`aggregateType`, `aggregateId`),
  INDEX `domain_events_eventType_occurredAt_idx` (`eventType`, `occurredAt`),
  INDEX `domain_events_published_createdAt_idx` (`published`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
