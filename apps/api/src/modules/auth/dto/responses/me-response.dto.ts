import { MembershipResponseDto } from '@/modules/membership/dto/responses/membership-response.dto';
import { OrganizationResponseDto } from '@/modules/organization/dto/responses/organization-response.dto';
import { UserResponseDto } from '@/modules/user/dto/responses/user-response.dto';
import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class MeOrganizationDto extends PickType(OrganizationResponseDto, [
  'id',
  'name',
  'slug',
] as const) {}

class MeMembershipDto extends PickType(MembershipResponseDto, [
  'id',
  'role',
] as const) {
  @ApiProperty({ type: MeOrganizationDto })
  @Type(() => MeOrganizationDto)
  organization!: MeOrganizationDto;
}

class MeExtraDto {
  @ApiProperty({ type: [MeMembershipDto] })
  @Type(() => MeMembershipDto)
  memberships!: MeMembershipDto[];
}

export class MeResponseDto extends IntersectionType(
  UserResponseDto,
  MeExtraDto,
) {}
