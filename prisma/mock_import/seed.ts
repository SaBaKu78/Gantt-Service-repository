import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { Prisma, PrismaClient } from '../../generated/prisma/client'
import { assignments } from '../../src/modules/assignment/assignment.data'
import { flights } from '../../src/modules/flight/flight.data'
import { resources } from '../../src/modules/resource/resource.data'
import { shiftdailys } from '../../src/modules/shiftdaily/shiftdaily.data'
import { tasks } from '../../src/modules/task/task.data'
import { prisma } from '../../src/lib/prisma'

const isoDateTime = /^\d{4}-\d{2}-\d{2}T/

function normalizeRow<T>(row: object): T {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (typeof value === 'string' && isoDateTime.test(value)) {
        return [key, new Date(value)]
      }
      if (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        Math.abs(value) > 2147483647
      ) {
        return [key, BigInt(value)]
      }
      return [key, value]
    }),
  ) as T
}

const normalizeRows = <T>(rows: readonly object[]) =>
  rows.map((row) => normalizeRow<T>(row))

async function insertInBatches<T>(
  label: string,
  rows: T[],
  insert: (data: T[]) => Promise<{ count: number }>,
  batchSize = 25,
) {
  let count = 0
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const result = await insert(rows.slice(offset, offset + batchSize))
    count += result.count
  }
  console.log(
    `${label}: ${count} rows inserted, ${rows.length - count} already existed`,
  )
}

async function main() {
  await insertInBatches(
    'resources',
    normalizeRows<Prisma.ResourceCreateManyInput>(resources),
    (data) => prisma.resource.createMany({ data, skipDuplicates: true }),
  )
  await insertInBatches(
    'flights',
    normalizeRows<Prisma.FlightCreateManyInput>(flights),
    (data) => prisma.flight.createMany({ data, skipDuplicates: true }),
  )
  await insertInBatches(
    'shifts',
    normalizeRows<Prisma.ShiftDailyCreateManyInput>(shiftdailys),
    (data) => prisma.shiftDaily.createMany({ data, skipDuplicates: true }),
  )
  await insertInBatches(
    'tasks',
    normalizeRows<Prisma.TaskCreateManyInput>(tasks),
    (data) => prisma.task.createMany({ data, skipDuplicates: true }),
    10,
  )
  await insertInBatches(
    'assignments',
    normalizeRows<Prisma.AssignmentCreateManyInput>(assignments),
    (data) => prisma.assignment.createMany({ data, skipDuplicates: true }),
  )
}

main()
  .catch((e) => {
    console.error('!!!!数据导入失败', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
