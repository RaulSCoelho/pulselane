import { ApiProperty } from '@nestjs/swagger'

export class OrganizationResponseDto {
  @ApiProperty({ example: 'clxorg123' })
  id!: string

  @ApiProperty({ example: 'Pulselane Labs' })
  name!: string

  @ApiProperty({ example: 'pulselane-labs' })
  slug!: string

  @ApiProperty({ example: '2026-04-02T18:25:43.511Z' })
  createdAt!: Date

  @ApiProperty({ example: '2026-04-02T18:25:43.511Z' })
  updatedAt!: Date
}
