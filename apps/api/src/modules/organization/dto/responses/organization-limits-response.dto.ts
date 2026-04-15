import { ApiProperty } from '@nestjs/swagger'

export class OrganizationLimitsResponseDto {
  @ApiProperty({ example: 3, nullable: true })
  members!: number | null

  @ApiProperty({ example: 10, nullable: true })
  clients!: number | null

  @ApiProperty({ example: 10, nullable: true })
  projects!: number | null

  @ApiProperty({ example: 100, nullable: true })
  activeTasks!: number | null
}
