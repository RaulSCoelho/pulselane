import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ProjectStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateProjectDto {
  @ApiProperty({ example: 'Website Redesign' })
  @IsString()
  @MaxLength(120)
  name!: string

  @ApiProperty({ example: 'clxclient123' })
  @IsString()
  clientId!: string

  @ApiPropertyOptional({
    example: 'Redesign the marketing website and landing pages'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.active })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus
}
