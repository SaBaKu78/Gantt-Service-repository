import { ResourceSearchParams } from './resource.schema'
import { Prisma, Resource, PrismaClient } from '../../../generated/prisma/client'

interface IResourceRepository {
  search(query: ResourceSearchParams): Promise<Resource[]>
}

export class ResourceRepository implements IResourceRepository {
  private readonly prisma: PrismaClient

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma
  }
  async search(query: ResourceSearchParams): Promise<Resource[]> {
    const where: Prisma.ResourceWhereInput = {}
    if(query.resourceCategoryCode) where.resourceCategoryCode = query.resourceCategoryCode
    return this.prisma.resource.findMany({
      where
    })
  }
}

export default ResourceRepository
