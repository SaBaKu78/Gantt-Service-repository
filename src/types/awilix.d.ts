import { ResourceController } from '../modules/resource/resource.controller'
import { ResourceRepository } from '../modules/resource/resource.repository'
import { ResourceService } from '../modules/resource/resource.service'
import { AssignmentController } from '../modules/assignment/assignment.controller'

declare module 'awilix' {
  interface Cradle {
    resourceRepository: ResourceRepository
    resourceController: ResourceController
    resourceService: ResourceService
    assignmentController: AssignmentController
  }

  interface RequestCradle {
    
  }
}

