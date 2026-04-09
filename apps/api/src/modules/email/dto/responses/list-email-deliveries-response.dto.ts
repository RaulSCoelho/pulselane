import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from '@/common/dto/pagination-meta-response.dto';
import { EmailDeliveryResponseDto } from './email-delivery-response.dto';

export class ListEmailDeliveriesResponseDto {
  @ApiProperty({ type: [EmailDeliveryResponseDto] })
  items!: EmailDeliveryResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta!: PaginationMetaResponseDto;
}
