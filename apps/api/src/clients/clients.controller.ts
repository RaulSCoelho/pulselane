import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import type { AuthenticatedRequest } from '@/auth/auth.controller';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { ListClientsResponseDto } from './dto/list-clients-response.dto';
import { SuccessResponseDto } from '@/common/dto/success-response.dto';

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
  description: 'You do not belong to this organization',
  type: ErrorResponseDto,
})
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @ApiOperation({ summary: 'Create client' })
  @ApiCreatedResponse({
    description: 'Client created successfully',
    type: ClientResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload or missing organization header',
    type: ErrorResponseDto,
  })
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @CurrentOrganizationId() organizationId: string,
    @Body() dto: CreateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.create(req.user.userId, organizationId, dto);
  }

  @ApiOperation({ summary: 'List clients' })
  @ApiOkResponse({
    description: 'Clients returned successfully',
    type: ListClientsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid query or missing organization header',
    type: ErrorResponseDto,
  })
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @CurrentOrganizationId() organizationId: string,
    @Query() query: ListClientsQueryDto,
  ): Promise<ListClientsResponseDto> {
    const items = await this.clientsService.findAll(
      req.user.userId,
      organizationId,
      query,
    );

    return { items };
  }

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
    description: 'Missing organization header',
    type: ErrorResponseDto,
  })
  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @CurrentOrganizationId() organizationId: string,
    @Param('id') clientId: string,
  ): Promise<ClientResponseDto> {
    return this.clientsService.findOne(
      req.user.userId,
      organizationId,
      clientId,
    );
  }

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
    description: 'Invalid payload or missing organization header',
    type: ErrorResponseDto,
  })
  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @CurrentOrganizationId() organizationId: string,
    @Param('id') clientId: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.update(
      req.user.userId,
      organizationId,
      clientId,
      dto,
    );
  }

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
    description: 'Missing organization header',
    type: ErrorResponseDto,
  })
  @Delete(':id')
  remove(
    @Req() req: AuthenticatedRequest,
    @CurrentOrganizationId() organizationId: string,
    @Param('id') clientId: string,
  ): Promise<SuccessResponseDto> {
    return this.clientsService.remove(
      req.user.userId,
      organizationId,
      clientId,
    );
  }
}
