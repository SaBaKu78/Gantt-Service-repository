import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import { ResourceSearchSchema } from '../modules/resource/resource.schema'

const resourceRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post('/resource/resource/search', {
    schema: {
      body: ResourceSearchSchema
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const controller = (request.diScope.cradle as any).resourceController
      return controller.search(request, reply)
    },
  })
}

export default resourceRoutes
