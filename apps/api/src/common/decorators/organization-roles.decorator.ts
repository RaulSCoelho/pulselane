import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';

export const ORGANIZATION_ROLES_KEY = 'organization_roles';

export function OrganizationRoles(...roles: MembershipRole[]) {
  return SetMetadata(ORGANIZATION_ROLES_KEY, roles);
}
