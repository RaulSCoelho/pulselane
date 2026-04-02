import { AccessTokenPayload } from '@/modules/auth/contracts/access-token-payload';
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }
}
