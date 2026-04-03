import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { OrganizationContextGuard } from '@/modules/organization/guards/organization-context.guard';

import { AuditLogsService } from './audit-logs.service';
import { ListAuditLogsQueryDto } from './dto/requests/list-audit-logs-query.dto';
import { ListAuditLogsResponseDto } from './dto/responses/list-audit-logs-response.dto';
import { normalizeMetadata } from './audit-logs.utils';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-organization-id',
  required: true,
  description: 'Current organization context',
})
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  type: ErrorResponseDto,
})
@ApiForbiddenResponse({
  description: 'User is not a member of this organization',
  type: ErrorResponseDto,
})
@UseGuards(OrganizationContextGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs' })
  @ApiOkResponse({
    description: 'Audit logs returned successfully',
    type: ListAuditLogsResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  async findAll(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListAuditLogsQueryDto,
  ): Promise<ListAuditLogsResponseDto> {
    const items = await this.auditLogsService.findAll(organizationId, query);

    return {
      items: items.map((item) => ({
        ...item,
        metadata: normalizeMetadata(item.metadata),
      })),
    };
  }
}
