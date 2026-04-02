import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClientStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListClientsQueryDto {
  @ApiPropertyOptional({ example: 'acme' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ClientStatus, example: ClientStatus.active })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}
