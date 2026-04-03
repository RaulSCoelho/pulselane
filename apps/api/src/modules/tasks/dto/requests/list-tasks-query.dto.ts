import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListTasksQueryDto {
  @ApiPropertyOptional({ example: 'proposal' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'clxproject123' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ example: 'clxuser123' })
  @IsOptional()
  @IsString()
  assigneeUserId?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.todo })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.medium })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}
