import { Cradle } from '@fastify/awilix'
import { asClass, asFunction, asValue, AwilixContainer } from 'awilix'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../lib/prisma'
import PrismaUnitOfWork from '../shared/infrastructure/transaction/prisma.unit-of-work'
import GanttRepositoryFactory from '../modules/gantt/gantt.repository.factory'
import AssignmentRepositoryFactory from '../modules/assignment/assignment.repository.factory'

const currentFile = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFile)

export async function registerRootContainer(container: AwilixContainer<Cradle>): Promise<void> {
  container.register({
    prisma: asValue(prisma),
    config: asValue({
      nodeEnv: process.env.NODE_ENV ?? 'development',
    }),
  })

  // fast-glob expects POSIX separators, including on Windows.
  const modulesGlob = (pattern: string) =>
    path.join(currentDir, pattern).replaceAll('\\', '/')

  container.loadModules(
    [modulesGlob('../modules/**/*.repository.{ts,js}')],
    {
      formatName: 'camelCase',
      esModules: false,
      resolverOptions: {
        lifetime: 'SINGLETON',
      },
    },
  )

  container.loadModules(
    [modulesGlob('../modules/**/*.service.{ts,js}')],
    {
      formatName: 'camelCase',
      esModules: false,
      resolverOptions: {
        lifetime: 'SCOPED',
      },
    },
  )

  container.loadModules(
    [modulesGlob('../modules/**/*.controller.{ts,js}')],
    {
      formatName: 'camelCase',
      esModules: false,
      resolverOptions: {
        lifetime: 'SCOPED',
      },
    },
  )

  container.register({
    unitOfWork: asClass(PrismaUnitOfWork).singleton(),
    ganttRepositoryFactory: asClass(GanttRepositoryFactory).singleton(),
    assignmentRepositoryFactory: asClass(AssignmentRepositoryFactory).singleton(),
  })
}
