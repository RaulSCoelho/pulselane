import { AccessRequestUser } from '@/modules/auth/contracts/access-request-user'
import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessRequestUser
  }
}
