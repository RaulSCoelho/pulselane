import { CryptoService } from '@/infra/crypto/crypto.service'
import { Module } from '@nestjs/common'

import { UserRepository } from './user.repository'
import { UserService } from './user.service'

@Module({
  providers: [CryptoService, UserService, UserRepository],
  exports: [UserService]
})
export class UserModule {}
