import type { FastifyReply, FastifyRequest } from 'fastify'
import { AssignmentService } from './assignment.service'

type IdParams = { id: string }

export class AssignmentController {
  private readonly assignmentService: AssignmentService

  constructor({ assignmentService }: { assignmentService: AssignmentService }) {
    this.assignmentService = assignmentService
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { taskId: string; resourceId: string; shiftDailyId: string; taskTypeId?: string; way?: number }
    const result = await this.assignmentService.assign({
      taskId: BigInt(body.taskId), resourceId: BigInt(body.resourceId), shiftDailyId: BigInt(body.shiftDailyId),
      taskTypeId: body.taskTypeId === undefined ? undefined : BigInt(body.taskTypeId), way: body.way,
    })
    return reply.code(201).send({ code: 201, data: serialize(result) })
  }

  async transition(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams
    const body = request.body as { status: Parameters<AssignmentService['transition']>[1]; version: number }
    const result = await this.assignmentService.transition(BigInt(id), body.status, body.version)
    return reply.send({ code: 200, data: serialize(result) })
  }
}

function serialize(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item))
}

export default AssignmentController
