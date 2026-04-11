import { ApiProperty } from '@nestjs/swagger'
import { ProjectStatus } from '@prisma/client'

import { ProjectClientResponseDto } from './project-client-response.dto'

export class ProjectResponseDto {
  @ApiProperty({ example: 'clxproject123' })
  id!: string

  @ApiProperty({ example: 'clxorg123' })
  organizationId!: string

  @ApiProperty({ example: 'clxclient123' })
  clientId!: string

  @ApiProperty({ example: 'Website Redesign' })
  name!: string

  @ApiProperty({
    example: 'Redesign the marketing website and landing pages',
    nullable: true
  })
  description!: string | null

  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.active })
  status!: ProjectStatus

  @ApiProperty({ example: '2026-04-09T20:00:00.000Z', nullable: true })
  archivedAt!: Date | null

  @ApiProperty({ type: ProjectClientResponseDto })
  client!: ProjectClientResponseDto

  @ApiProperty({ example: '2026-04-03T20:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2026-04-03T20:00:00.000Z' })
  updatedAt!: Date
}
