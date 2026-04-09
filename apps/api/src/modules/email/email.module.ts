import { Module } from '@nestjs/common';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { EmailService } from './email.service';
import { EmailRepository } from './email.repository';
import { EmailController } from './email.controller';

@Module({
  imports: [OrganizationModule],
  controllers: [EmailController],
  providers: [EmailService, EmailRepository],
  exports: [EmailService],
})
export class EmailModule {}
