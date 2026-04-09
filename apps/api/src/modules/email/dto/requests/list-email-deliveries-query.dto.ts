import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmailDeliveryStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class ListEmailDeliveriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'invitee@example.com' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({
    enum: EmailDeliveryStatus,
    example: EmailDeliveryStatus.sent,
  })
  @IsOptional()
  @IsEnum(EmailDeliveryStatus)
  status?: EmailDeliveryStatus;
}
