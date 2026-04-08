import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { OrganizationRoles } from '@/common/decorators/organization-roles.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { SuccessResponseDto } from '@/common/dto/success-response.dto';
import type { AccessRequestUser } from '@/modules/auth/contracts/access-request-user';
import { OrganizationContextGuard } from '@/modules/organization/guards/organization-context.guard';
import { OrganizationRolesGuard } from '@/modules/organization/guards/organization-roles.guard';

import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/requests/create-client.dto';
import { ListClientsQueryDto } from './dto/requests/list-clients-query.dto';
import { UpdateClientDto } from './dto/requests/update-client.dto';
import { ClientResponseDto } from './dto/responses/client-response.dto';
import { ListClientsResponseDto } from './dto/responses/list-clients-response.dto';

@ApiTags('Clients')
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
  description: 'Forbidden',
  type: ErrorResponseDto,
})
@UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @OrganizationRoles(
    MembershipRole.owner,
    MembershipRole.admin,
    MembershipRole.member,
  )
  @ApiOperation({ summary: 'Create client' })
  @ApiCreatedResponse({
    description: 'Client created successfully',
    type: ClientResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  create(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.create(actorUserId, organizationId, dto);
  }

  @Get()
  @OrganizationRoles(
    MembershipRole.owner,
    MembershipRole.admin,
    MembershipRole.member,
    MembershipRole.viewer,
  )
  @ApiOperation({ summary: 'List clients' })
  @ApiOkResponse({
    description: 'Clients returned successfully',
    type: ListClientsResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  findAll(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListClientsQueryDto,
  ): Promise<ListClientsResponseDto> {
    return this.clientsService.findAll(organizationId, query);
  }

  @Get(':id')
  @OrganizationRoles(
    MembershipRole.owner,
    MembershipRole.admin,
    MembershipRole.member,
    MembershipRole.viewer,
  )
  @ApiOperation({ summary: 'Get client by id' })
  @ApiOkResponse({
    description: 'Client returned successfully',
    type: ClientResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Client not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  findOne(
    @CurrentOrganization('id') organizationId: string,
    @Param('id') clientId: string,
  ): Promise<ClientResponseDto> {
    return this.clientsService.findOne(organizationId, clientId);
  }

  @Patch(':id')
  @OrganizationRoles(
    MembershipRole.owner,
    MembershipRole.admin,
    MembershipRole.member,
  )
  @ApiOperation({ summary: 'Update client' })
  @ApiOkResponse({
    description: 'Client updated successfully',
    type: ClientResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Client not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  update(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') clientId: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.update(
      actorUserId,
      organizationId,
      clientId,
      dto,
    );
  }

  @Delete(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiOperation({ summary: 'Delete client' })
  @ApiOkResponse({
    description: 'Client deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Client not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  remove(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') clientId: string,
  ): Promise<SuccessResponseDto> {
    return this.clientsService.remove(actorUserId, organizationId, clientId);
  }
}
