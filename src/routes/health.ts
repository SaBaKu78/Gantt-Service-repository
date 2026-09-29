import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/health', async () => ({ code: 200, data: { status: 'ok' } }))
}

export default healthRoutes
