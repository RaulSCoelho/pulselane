import { Injectable } from '@nestjs/common';

@Injectable()
export class CryptoService {
  private readonly saltRounds = 10;

  async hash(value: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(value, this.saltRounds);
  }

  async compare(value: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(value, hash);
  }
}
