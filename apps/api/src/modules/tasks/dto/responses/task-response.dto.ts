import { ApiProperty } from '@nestjs/swagger'
import { TaskPriority, TaskStatus } from '@prisma/client'

import { TaskAssigneeResponseDto } from './task-assignee-response.dto'
import { TaskProjectResponseDto } from './task-project-response.dto'

export class TaskResponseDto {
  @ApiProperty({ example: 'clxtask123' })
  id!: string

  @ApiProperty({ example: 'clxorg123' })
  organizationId!: string

  @ApiProperty({ example: 'clxproject123' })
  projectId!: string

  @ApiProperty({ example: 'clxuser123', nullable: true })
  assigneeUserId!: string | null

  @ApiProperty({ example: 'Prepare proposal draft' })
  title!: string

  @ApiProperty({
    example: 'Draft the proposal and review pricing before sending',
    nullable: true
  })
  description!: string | null

  @ApiProperty({
    example: 'Waiting for client approval before continuing',
    nullable: true
  })
  blockedReason!: string | null

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.todo })
  status!: TaskStatus

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.medium })
  priority!: TaskPriority

  @ApiProperty({ example: '2026-04-10T18:00:00.000Z', nullable: true })
  dueDate!: Date | null

  @ApiProperty({ example: '2026-04-09T20:00:00.000Z', nullable: true })
  archivedAt!: Date | null

  @ApiProperty({ type: TaskProjectResponseDto })
  project!: TaskProjectResponseDto

  @ApiProperty({ type: TaskAssigneeResponseDto, nullable: true })
  assignee!: TaskAssigneeResponseDto | null

  @ApiProperty({ example: '2026-04-03T20:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2026-04-03T20:00:00.000Z' })
  updatedAt!: Date
}
