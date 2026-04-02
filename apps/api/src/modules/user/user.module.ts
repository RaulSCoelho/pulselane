import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CryptoService } from '@/infra/crypto/crypto.service';
import { UserService } from './user.service';

@Module({
  providers: [CryptoService, UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
