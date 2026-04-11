import { CursorPaginationQueryDto } from '@/common/pagination/dto/cursor-pagination-query.dto'
import { toBoolean } from '@/common/utils/to-boolean.util'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { TaskPriority, TaskStatus } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'

export class ListTasksQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: 'proposal' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ example: 'clxproject123' })
  @IsOptional()
  @IsString()
  projectId?: string

  @ApiPropertyOptional({ example: 'clxuser123' })
  @IsOptional()
  @IsString()
  assigneeUserId?: string

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.todo })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.medium })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Include archived tasks in results'
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  includeArchived?: boolean = false
}
