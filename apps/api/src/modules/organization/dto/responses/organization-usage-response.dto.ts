import { ApiProperty } from '@nestjs/swagger'

export class OrganizationUsageResponseDto {
  @ApiProperty({ example: 2 })
  members!: number

  @ApiProperty({ example: 4 })
  clients!: number

  @ApiProperty({ example: 6 })
  projects!: number

  @ApiProperty({ example: 12 })
  activeTasks!: number
}
