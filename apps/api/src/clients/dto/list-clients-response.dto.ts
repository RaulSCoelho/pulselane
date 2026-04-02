import { ApiProperty } from '@nestjs/swagger';
import { ClientResponseDto } from './client-response.dto';

export class ListClientsResponseDto {
  @ApiProperty({ type: [ClientResponseDto] })
  items!: ClientResponseDto[];
}
