import { Global, Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { OrganizationContextGuard } from './guards/organization-context.guard'
import { OrganizationRolesGuard } from './guards/organization-roles.guard'

@Global()
@Module({
  providers: [Reflector, OrganizationContextGuard, OrganizationRolesGuard],
  exports: [OrganizationContextGuard, OrganizationRolesGuard]
})
export class OrganizationAccessModule {}
