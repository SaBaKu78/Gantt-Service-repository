import { FastifyReply, FastifyRequest } from 'fastify'
import { GanttSearch } from './gantt.schema'
import GanttService from './gantt.service'
import { serialize } from '../../utils/util'

export class GanttController {
  private readonly ganttService: GanttService
  constructor({ ganttService }: { ganttService: GanttService }) {
    this.ganttService = ganttService
  }

  async search(request: FastifyRequest, reply: FastifyReply){
    const params = request.body as GanttSearch
    const result = await this.ganttService.search(params)
    return reply.send({
      code: 200,
      data: serialize(result)
    })
  }
}

export default GanttController