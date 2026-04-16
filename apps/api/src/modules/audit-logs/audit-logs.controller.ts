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

import { AuditLogsService } from './audit-logs.service'
import { ListAuditLogsQueryDto } from './dto/requests/list-audit-logs-query.dto'
import { ListAuditLogsResponseDto } from './dto/responses/list-audit-logs-response.dto'

@ApiTags('Audit Logs')
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
  description: 'Only organization owners and admins can access audit logs',
  type: ErrorResponseDto
})
@UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiOperation({ summary: 'List audit logs' })
  @ApiOkResponse({
    description: 'Audit logs returned successfully',
    type: ListAuditLogsResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto
  })
  async findAll(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListAuditLogsQueryDto
  ): Promise<ListAuditLogsResponseDto> {
    return this.auditLogsService.findAll(organizationId, query)
  }
}
