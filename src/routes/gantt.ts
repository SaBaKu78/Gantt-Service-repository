import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { GanttSearchSchema } from "../modules/gantt/gantt.schema";

export const ganttRoutes = async (app: FastifyInstance) => {
  app.post('/basedata/gantt/search', {
    schema: {
      body: GanttSearchSchema
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const controller = (request.diScope.cradle as any).ganttController
      return controller.search(request, reply)
    },
  })
}

export default ganttRoutes