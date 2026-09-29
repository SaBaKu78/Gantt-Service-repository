import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { assignmentCreateSchema, assignmentTransitionSchema } from '../modules/assignment/assignment.schema'
import { AssignmentDomainError } from '../modules/assignment/assignment.domain'

const assignmentRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const handle = async (work: () => Promise<unknown>, reply: any) => {
    try {
      return await work()
    } catch (error) {
      if (error instanceof AssignmentDomainError) {
        const status = error.code.endsWith('NOT_FOUND') ? 404 : 409
        return reply.code(status).send({ code: status, error: error.code, message: error.message })
      }
      if (error instanceof Error && error.message === 'Assignment version conflict') {
        return reply.code(409).send({ code: 409, error: 'VERSION_CONFLICT', message: error.message })
      }
      throw error
    }
  }

  app.post('/assignments', { schema: assignmentCreateSchema, handler: (request, reply) => handle(() => (request.diScope.cradle as any).assignmentController.create(request, reply), reply) })
  app.post('/assignments/:id/transition', { schema: assignmentTransitionSchema, handler: (request, reply) => handle(() => (request.diScope.cradle as any).assignmentController.transition(request, reply), reply) })
}

export default assignmentRoutes
