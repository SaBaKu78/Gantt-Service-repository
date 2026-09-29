import assert from 'node:assert/strict'
import type { Prisma } from '../generated/prisma/client'
import { AssignmentDomainError } from '../src/modules/assignment/assignment.domain'
import type {
  AssignmentResource,
  IAssignmentRepository,
  IAssignmentRepositoryFactory,
} from '../src/modules/assignment/assignment.port'
import { AssignmentService } from '../src/modules/assignment/assignment.service'
import type { IUnitOfWork } from '../src/shared/application/unit-of-work.port'

const unitOfWork: IUnitOfWork = {
  execute: async (work) => work({} as Prisma.TransactionClient),
}

function repository(overrides: Partial<IAssignmentRepository> = {}): IAssignmentRepository {
  const task = {
    id: 1n,
    taskTypeId: 67n,
    deleted: false,
    locked: false,
    currentAssignmentId: null,
    scheduleStartTime: new Date('2026-01-01T10:00:00Z'),
    scheduleEndTime: new Date('2026-01-01T11:00:00Z'),
  }
  const resource = repositoryResource()
  const shift = {
    id: 4n,
    resourceId: 2n,
    dailyOnOff: 1,
    plannedStartTime: new Date('2026-01-01T09:00:00Z'),
    plannedEndTime: new Date('2026-01-01T12:00:00Z'),
  }
  const record = {
    id: 5n,
    taskId: 1n,
    resourceId: 2n,
    shiftDailyId: 4n,
    status: 'ASSIGNED' as const,
    version: 1,
    deleted: false,
    assignedAt: new Date(),
    acceptedAt: null,
    releasedAt: null,
  }
  return {
    findTaskForUpdateById: async () => task,
    findResource: async () => resource,
    findResourceForUpdateById: async () => resource,
    findShift: async () => shift,
    findById: async () => record,
    findAssignmentById: async () => record,
    findResourceIsConflict: async () => null,
    appendEvent: async () => 1n,
    create: async () => record,
    transition: async (_, __, status) => ({ ...record, status, version: 2 }),
    setTaskCurrentAssignment: async () => {},
    updateTaskAfterTransition: async () => {},
    ...overrides,
  }
}

function service(overrides: Partial<IAssignmentRepository> = {}) {
  const factory: IAssignmentRepositoryFactory = {
    create: () => repository(overrides),
  }
  return new AssignmentService({
    unitOfWork,
    assignmentRepositoryFactory: factory,
  })
}

async function run() {
  const assignmentService = service()
  const created = await assignmentService.assign({
    taskId: 1n,
    resourceId: 2n,
    shiftDailyId: 4n,
  })
  assert.equal(created.status, 'ASSIGNED')

  await assert.rejects(
    () => service({
      findTaskForUpdateById: async () => ({
        id: 1n,
        taskTypeId: 67n,
        deleted: false,
        locked: false,
        currentAssignmentId: 9n,
        scheduleStartTime: new Date('2026-01-01T10:00:00Z'),
        scheduleEndTime: new Date('2026-01-01T11:00:00Z'),
      }),
    }).assign({ taskId: 1n, resourceId: 2n, shiftDailyId: 4n }),
    (error: unknown) =>
      error instanceof AssignmentDomainError &&
      error.code === 'TASK_ALREADY_ASSIGNED',
  )

  const accepted = await assignmentService.transition(5n, 'ACCEPTED', 1)
  assert.equal(accepted.status, 'ACCEPTED')

  await assert.rejects(
    () => assignmentService.transition(5n, 'COMPLETED', 1),
    (error: unknown) =>
      error instanceof AssignmentDomainError &&
      error.code === 'INVALID_STATUS_TRANSITION',
  )

  await assert.rejects(
    () => service({
      transition: async () => {
        throw new AssignmentDomainError(
          'VERSION_CONFLICT',
          'Assignment version conflict',
        )
      },
    }).transition(5n, 'ACCEPTED', 1),
    (error: unknown) =>
      error instanceof AssignmentDomainError &&
      error.code === 'VERSION_CONFLICT',
  )

  await assert.rejects(
    () => service({
      findResource: async () => ({
        ...repositoryResource(),
        resourceStatus: 'OFF',
      }),
    }).assign({ taskId: 1n, resourceId: 2n, shiftDailyId: 4n }),
    (error: unknown) =>
      error instanceof AssignmentDomainError &&
      error.code === 'RESOURCE_UNAVAILABLE',
  )
}

function repositoryResource(): AssignmentResource {
  return {
    id: 2n,
    code: 'R2',
    name: 'Resource 2',
    displayName: 'R2',
    resourceExternalId: 'EXT2',
    resourceGroupId: 3n,
    resourceStatus: 'ON',
    displayed: true,
  }
}

await run()
console.log('assignment service tests passed')
