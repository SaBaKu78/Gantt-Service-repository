import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../../generated/prisma/client'
import { databaseConnectionFromUrl, environment } from '../config/env'

const adapter = new PrismaMariaDb(
  databaseConnectionFromUrl(environment.DATABASE_URL),
)

export const prisma = new PrismaClient({ adapter })
