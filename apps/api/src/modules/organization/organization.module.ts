import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationRepository } from './organization.repository';

@Module({
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService],
})
export class OrganizationModule {}
