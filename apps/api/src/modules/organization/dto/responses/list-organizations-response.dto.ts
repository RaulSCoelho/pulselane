import { ApiProperty } from '@nestjs/swagger'

import { OrganizationResponseDto } from './organization-response.dto'

export class ListOrganizationsResponseDto {
  @ApiProperty({ type: [OrganizationResponseDto] })
  items!: OrganizationResponseDto[]
}
