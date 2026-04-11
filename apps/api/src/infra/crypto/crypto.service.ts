import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'

@Injectable()
export class CryptoService {
  private readonly saltRounds = 10

  async hashPassword(value: string): Promise<string> {
    const bcrypt = await import('bcrypt')
    return bcrypt.hash(value, this.saltRounds)
  }

  async comparePassword(value: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt')
    return bcrypt.compare(value, hash)
  }

  hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex')
  }

  compareToken(value: string, hash: string): boolean {
    return this.hashToken(value) === hash
  }
}
