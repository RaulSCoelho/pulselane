import { ApiProperty } from '@nestjs/swagger';

export class AuthOrganizationDto {
  @ApiProperty({ example: 'clxorg123' })
  id!: string;

  @ApiProperty({ example: 'Pulselane Labs' })
  name!: string;

  @ApiProperty({ example: 'pulselane-labs' })
  slug!: string;
}
