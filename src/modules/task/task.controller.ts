import { FastifyReply, FastifyRequest } from 'fastify'
import { TaskSearchParams } from './task.schema'
import { TaskService } from './task.service'
import { serialize } from '../../utils/util'

export class TaskController {
  private taskService: TaskService
  constructor({ taskService }: { taskService: TaskService }) {
    this.taskService = taskService
  }

  async search(request: FastifyRequest, reply: FastifyReply) {
    const params = request.body as TaskSearchParams
    const data = await this.taskService.search(params)
    return reply.send({
      code: 200,
      data: serialize(data),
    })
  }
}

export default TaskController
