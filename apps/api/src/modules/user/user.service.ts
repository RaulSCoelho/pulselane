import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository } from './user.repository';
import { CryptoService } from '@/infra/crypto/crypto.service';

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cryptoService: CryptoService,
  ) {}

  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    return this.userRepository.findByEmail(email, tx);
  }

  async create(data: CreateUserInput, tx?: Prisma.TransactionClient) {
    const existing = await this.userRepository.findByEmail(data.email, tx);

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await this.cryptoService.hash(data.password);

    return this.userRepository.create(
      {
        name: data.name,
        email: data.email,
        passwordHash,
      },
      tx,
    );
  }
}
