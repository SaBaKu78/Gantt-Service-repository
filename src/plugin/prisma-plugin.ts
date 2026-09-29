import fastifyPlugin from 'fastify-plugin'
import { prisma } from '../lib/prisma'

export default fastifyPlugin(async (fastify) => {
  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
})
