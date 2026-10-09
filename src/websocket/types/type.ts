export type WsCategory = 'task' | 'resource' | 'shiftdaily'

export type WsAction = 'created' | 'updated' | 'deleted'


export interface WsEvent<T = unknown> {
  category: WsCategory,
  action: WsAction,
  data: T
}


export interface WsConnectionContext {
  projectId: string
} 