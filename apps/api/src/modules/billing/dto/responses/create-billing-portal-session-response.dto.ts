import { ApiProperty } from '@nestjs/swagger'

export class CreateBillingPortalSessionResponseDto {
  @ApiProperty({ example: 'https://billing.stripe.com/p/session/test_123' })
  url!: string
}
