import { CurrentOrganization } from '@/common/decorators/current-organization.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { ErrorResponseDto } from '@/common/dto/error-response.dto'
import type { AccessRequestUser } from '@/modules/auth/contracts/access-request-user'
import { Controller, Get, UseGuards } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'

import { ListOrganizationsResponseDto } from './dto/responses/list-organizations-response.dto'
import { OrganizationResponseDto } from './dto/responses/organization-response.dto'
import { OrganizationContextGuard } from './guards/organization-context.guard'
import { OrganizationService } from './organization.service'

@ApiTags('Organizations')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  type: ErrorResponseDto
})
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @ApiOperation({ summary: 'List organizations for current user' })
  @ApiOkResponse({
    description: 'Organizations returned successfully',
    type: ListOrganizationsResponseDto
  })
  async list(@CurrentUser('sub') userId: AccessRequestUser['sub']): Promise<ListOrganizationsResponseDto> {
    return this.organizationService.findAllByUserId(userId).then(items => ({
      items
    }))
  }

  @Get('current')
  @UseGuards(OrganizationContextGuard)
  @ApiHeader({
    name: 'x-organization-id',
    required: true,
    description: 'Current organization context'
  })
  @ApiOperation({ summary: 'Get current organization by header context' })
  @ApiOkResponse({
    description: 'Current organization returned successfully',
    type: OrganizationResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Missing x-organization-id header',
    type: ErrorResponseDto
  })
  @ApiForbiddenResponse({
    description: 'User is not a member of this organization',
    type: ErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
    type: ErrorResponseDto
  })
  current(@CurrentOrganization() organization: OrganizationResponseDto): Promise<OrganizationResponseDto> {
    return Promise.resolve(organization)
  }
}
