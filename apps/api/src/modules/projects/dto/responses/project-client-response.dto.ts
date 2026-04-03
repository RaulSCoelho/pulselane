import { ApiProperty } from '@nestjs/swagger';

export class ProjectClientResponseDto {
  @ApiProperty({ example: 'clxclient123' })
  id!: string;

  @ApiProperty({ example: 'Acme Corp' })
  name!: string;
}
