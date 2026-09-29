-- Add the task-side pointer and snapshot for the current assignment.
ALTER TABLE `tasks`
    ADD COLUMN `currentAssignmentId` BIGINT UNSIGNED NULL,
    ADD COLUMN `currentAssignmentStatus` VARCHAR(32) NULL,
    ADD COLUMN `currentAssignmentVersion` INTEGER NULL,
    ADD COLUMN `currentShiftDailyId` BIGINT UNSIGNED NULL;

CREATE UNIQUE INDEX `tasks_currentAssignmentId_key`
    ON `tasks`(`currentAssignmentId`);

CREATE INDEX `tasks_currentResourceId_currentShiftDailyId_idx`
    ON `tasks`(`currentResourceId`, `currentShiftDailyId`);
