import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator'

import { slugifyOrganizationName } from '../../organization.utils'

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Pulselane Labs' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value) as unknown)
  @IsString()
  @MaxLength(120)
  name?: string

  @ApiPropertyOptional({ example: 'pulselane-labs' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? slugifyOrganizationName(value.trim()) : value) as unknown)
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens'
  })
  slug?: string
}
