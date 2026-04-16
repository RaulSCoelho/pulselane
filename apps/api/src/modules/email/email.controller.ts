import { CurrentOrganization } from '@/common/decorators/current-organization.decorator'
import { OrganizationRoles } from '@/common/decorators/organization-roles.decorator'
import { ErrorResponseDto } from '@/common/dto/error-response.dto'
import { OrganizationContextGuard } from '@/modules/organization/guards/organization-context.guard'
import { OrganizationRolesGuard } from '@/modules/organization/guards/organization-roles.guard'
import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { MembershipRole } from '@prisma/client'

import { ListEmailDeliveriesQueryDto } from './dto/requests/list-email-deliveries-query.dto'
import { ListEmailDeliveriesResponseDto } from './dto/responses/list-email-deliveries-response.dto'
import { EmailService } from './email.service'

@ApiTags('Email Deliveries')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-organization-id',
  required: true,
  description: 'Current organization context'
})
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  type: ErrorResponseDto
})
@ApiForbiddenResponse({
  description: 'Forbidden',
  type: ErrorResponseDto
})
@UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
@Controller({ path: 'email-deliveries', version: '1' })
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get()
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiOperation({ summary: 'List email deliveries' })
  @ApiOkResponse({
    description: 'Email deliveries returned successfully',
    type: ListEmailDeliveriesResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto
  })
  findAll(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListEmailDeliveriesQueryDto
  ): Promise<ListEmailDeliveriesResponseDto> {
    return this.emailService.findAll(organizationId, query)
  }
}
