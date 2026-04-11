import { CursorPaginationQueryDto } from '@/common/pagination/dto/cursor-pagination-query.dto'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { EmailDeliveryStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class ListEmailDeliveriesQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: 'invitee@example.com' })
  @IsOptional()
  @IsString()
  to?: string

  @ApiPropertyOptional({
    enum: EmailDeliveryStatus,
    example: EmailDeliveryStatus.sent
  })
  @IsOptional()
  @IsEnum(EmailDeliveryStatus)
  status?: EmailDeliveryStatus
}
