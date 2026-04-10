import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CursorPageMetaResponseDto {
  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiPropertyOptional({
    example:
      'eyJpZCI6ImNseGNsaWVudDEyMyIsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMDlUMTI6MDA6MDAuMDAwWiJ9',
    nullable: true,
  })
  nextCursor!: string | null;
}
