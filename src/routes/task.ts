import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import { TaskSearchSchema } from '../modules/task/task.schema'

const taskRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post('/basedata/task/base/task/searchTask', {
    schema: {
      body: TaskSearchSchema,
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const controller = (request.diScope.cradle as any).taskController
      return controller.search(request, reply)
    },
  })
}

export default taskRoutes
