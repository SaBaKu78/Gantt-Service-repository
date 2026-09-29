import { Task } from '../../../generated/prisma/client'
import { TaskRepository } from './task.repository'
import { TaskSearchParams } from './task.schema'

interface ITaskService {
  search(query: TaskSearchParams): Promise<Task[]>
}

export class TaskService implements ITaskService {
  private readonly taskRepository: TaskRepository

  constructor({ taskRepository }: { taskRepository: TaskRepository }) {
    this.taskRepository = taskRepository
  }

  search(query: TaskSearchParams): Promise<Task[]> {
    return this.taskRepository.search(query)
  }
}

export default TaskService
