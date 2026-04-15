import { ApiProperty } from '@nestjs/swagger'

export class CreateCheckoutSessionResponseDto {
  @ApiProperty({ example: 'cs_test_123' })
  sessionId!: string

  @ApiProperty({ example: 'https://checkout.stripe.com/c/pay/cs_test_123' })
  url!: string
}
