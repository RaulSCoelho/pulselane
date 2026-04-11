import { CursorPaginationQueryDto } from '@/common/pagination/dto/cursor-pagination-query.dto'
import { toBoolean } from '@/common/utils/to-boolean.util'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { ClientStatus } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'

export class ListClientsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: 'acme' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ enum: ClientStatus, example: ClientStatus.active })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Include archived clients in results'
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  includeArchived?: boolean = false
}
