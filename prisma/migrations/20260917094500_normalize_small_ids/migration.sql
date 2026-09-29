-- AlterTable
ALTER TABLE `assignments` MODIFY `departmentId` INTEGER NOT NULL,
    MODIFY `organizationId` INTEGER NOT NULL,
    MODIFY `updateUserId` INTEGER NOT NULL,
    MODIFY `createUserId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `flights` MODIFY `standId` INTEGER NOT NULL,
    MODIFY `standAreaId` INTEGER NOT NULL,
    MODIFY `standApronId` INTEGER NOT NULL,
    MODIFY `terminalBuildingId` INTEGER NOT NULL,
    MODIFY `updateUserId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `resources` MODIFY `resourceLinkId` INTEGER NOT NULL,
    MODIFY `departmentId` INTEGER NOT NULL,
    MODIFY `organizationId` INTEGER NOT NULL,
    MODIFY `updateUserId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `shift_daily` MODIFY `patternId` INTEGER NOT NULL,
    MODIFY `locationAreaId` INTEGER NOT NULL,
    MODIFY `departmentId` INTEGER NOT NULL,
    MODIFY `organizationId` INTEGER NOT NULL,
    MODIFY `updateUserId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `tasks` MODIFY `fromLocationId` INTEGER NULL,
    MODIFY `fromLocationAreaId` INTEGER NULL,
    MODIFY `parentId` INTEGER NOT NULL,
    MODIFY `taskAssignUserId` INTEGER NULL,
    MODIFY `taskAssignCreateUserId` INTEGER NULL,
    MODIFY `organizationId` INTEGER NOT NULL,
    MODIFY `updateUserId` INTEGER NOT NULL,
    MODIFY `createUserId` INTEGER NOT NULL,
    MODIFY `relatedFlightId` INTEGER NOT NULL,
    MODIFY `inBoundStandApronId` INTEGER NULL,
    MODIFY `outBoundStandApronId` INTEGER NULL,
    MODIFY `toLocationAreaId` INTEGER NULL;
