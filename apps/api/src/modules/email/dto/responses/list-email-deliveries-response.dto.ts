import { ApiProperty } from '@nestjs/swagger';
import { CursorPageMetaResponseDto } from '@/common/pagination/dto/cursor-page-meta-response.dto';
import { EmailDeliveryResponseDto } from './email-delivery-response.dto';

export class ListEmailDeliveriesResponseDto {
  @ApiProperty({ type: [EmailDeliveryResponseDto] })
  items!: EmailDeliveryResponseDto[];

  @ApiProperty({ type: CursorPageMetaResponseDto })
  meta!: CursorPageMetaResponseDto;
}
