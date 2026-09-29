import { ResourceRepository } from './resource.repository'
import { Resource } from '../../../generated/prisma/client'
import { ResourceSearchParams } from './resource.schema'

interface IResourceService {
  search(query: ResourceSearchParams): Promise<Resource[]>
}

export class ResourceService implements IResourceService {
  private resourceRepository: ResourceRepository

  constructor({ resourceRepository }: { resourceRepository: ResourceRepository }) {
    this.resourceRepository = resourceRepository
  }

  async search(query: ResourceSearchParams): Promise<Resource[]> {
    return this.resourceRepository.search(query)
  }
}

export default ResourceService
