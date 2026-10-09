import { WsHub } from "./WsHub";

export class WsPublisher {
  constructor(private readonly hub: WsHub) {}

  taskCreated(projectId: string, data: unknown) {
    this.hub.broadToProject(projectId, {
      category: 'task',
      action: 'created',
      data
    })
  }

  taskUpdated(projectId: string, data: unknown) {
    this.hub.broadToProject(projectId, {
      category: 'task',
      action: 'updated',
      data
    })
  }

  taskDeleted(projectId: string, data: unknown) {
    this.hub.broadToProject(projectId, {
      category: 'task',
      action: 'deleted',
      data
    })
  }
} 