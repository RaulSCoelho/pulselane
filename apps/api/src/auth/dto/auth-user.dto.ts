import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: 'clx123abc' })
  id!: string;

  @ApiProperty({ example: 'Raul Semicek' })
  name!: string;

  @ApiProperty({ example: 'raul@example.com' })
  email!: string;
}
