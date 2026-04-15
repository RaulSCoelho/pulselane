import { CursorPaginationQueryDto } from '@/common/pagination/dto/cursor-pagination-query.dto'
import { toBoolean } from '@/common/utils/to-boolean.util'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { TaskPriority, TaskStatus } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'

export enum TaskSortBy {
  createdAt = 'created_at',
  dueDate = 'due_date'
}

export enum SortDirection {
  asc = 'asc',
  desc = 'desc'
}

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
    example: true,
    description: 'Return only overdue tasks. Overdue means due date in the past and status not done or archived.'
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  overdue?: boolean = false

  @ApiPropertyOptional({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Filter tasks with due date greater than or equal to this value'
  })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string

  @ApiPropertyOptional({
    example: '2026-04-30T23:59:59.999Z',
    description: 'Filter tasks with due date less than or equal to this value'
  })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string

  @ApiPropertyOptional({
    enum: TaskSortBy,
    default: TaskSortBy.createdAt
  })
  @IsOptional()
  @IsEnum(TaskSortBy)
  sortBy?: TaskSortBy = TaskSortBy.createdAt

  @ApiPropertyOptional({
    enum: SortDirection,
    default: SortDirection.desc
  })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection = SortDirection.desc

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
