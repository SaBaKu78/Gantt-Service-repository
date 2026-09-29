import { FastifyReply, FastifyRequest } from 'fastify'
import { ResourceService } from './resource.service'
import { ResourceSearchParams } from './resource.schema'
import { serialize } from '../../utils/util'

export class ResourceController {
  constructor({ resourceService }: { resourceService: ResourceService }) {
    this.resourceService = resourceService
  }

  private resourceService: ResourceService

  async search(request: FastifyRequest, reply: FastifyReply) {
    const params = (request.body as ResourceSearchParams | undefined) ?? {
      resourceCategoryCode: 'STAF',
    }
    const data = await this.resourceService.search(params)
    return reply.send({
      code: 200,
      data: serialize(data),
    })
  }
}

export default ResourceController
