import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListProjectsQueryDto {
  @ApiPropertyOptional({ example: 'website' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'clxclient123' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, example: ProjectStatus.active })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
