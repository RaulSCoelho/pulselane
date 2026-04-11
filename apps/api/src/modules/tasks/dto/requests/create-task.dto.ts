import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TaskPriority, TaskStatus } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateTaskDto {
  @ApiProperty({ example: 'Prepare proposal draft' })
  @IsString()
  @MaxLength(160)
  title!: string

  @ApiProperty({ example: 'clxproject123' })
  @IsString()
  projectId!: string

  @ApiPropertyOptional({
    example: 'Draft the proposal and review pricing before sending'
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @ApiPropertyOptional({ example: 'clxuser123', nullable: true })
  @IsOptional()
  @IsString()
  assigneeUserId?: string

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.todo })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.medium })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority

  @ApiPropertyOptional({
    example: '2026-04-10T18:00:00.000Z',
    nullable: true
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string
}
