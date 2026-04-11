import { CursorPaginationQueryDto } from '@/common/pagination/dto/cursor-pagination-query.dto'
import { toBoolean } from '@/common/utils/to-boolean.util'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { ProjectStatus } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'

export class ListProjectsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: 'website' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ example: 'clxclient123' })
  @IsOptional()
  @IsString()
  clientId?: string

  @ApiPropertyOptional({ enum: ProjectStatus, example: ProjectStatus.active })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Include archived projects in results'
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  includeArchived?: boolean = false
}
