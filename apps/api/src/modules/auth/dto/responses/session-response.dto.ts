import { ApiProperty } from '@nestjs/swagger'

export class SessionResponseDto {
  @ApiProperty({
    example: 'clx9k2j3k0000abc123def456',
    description: 'Unique identifier of the session'
  })
  id!: string

  @ApiProperty({
    example: 'b3d9f1a2-8c3a-4c5e-9f21-abc123456789',
    description: 'Device identifier associated with this session'
  })
  deviceId!: string

  @ApiProperty({
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
    nullable: true,
    description: 'User agent string captured at session creation (may be null)'
  })
  userAgent!: string | null

  @ApiProperty({
    example: '192.168.0.1',
    nullable: true,
    description: 'IP address used when the session was created or last used (may be null)'
  })
  ipAddress!: string | null

  @ApiProperty({
    example: '2026-04-02T18:25:43.511Z',
    description: 'Date when the session was created'
  })
  createdAt!: Date

  @ApiProperty({
    example: '2026-04-02T19:10:10.120Z',
    nullable: true,
    description: 'Last time this session was used (updated on refresh or API usage)'
  })
  lastUsedAt!: Date | null

  @ApiProperty({
    example: '2026-04-09T18:25:43.511Z',
    description: 'Expiration date of the session (based on refresh token lifetime)'
  })
  expiresAt!: Date

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Date when the session was explicitly revoked (logout)'
  })
  revokedAt!: Date | null

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Date when the session was marked as compromised (e.g. token mismatch / possible theft)'
  })
  compromisedAt!: Date | null

  @ApiProperty({
    example: true,
    description: 'Indicates if this session is the current one (based on access token sessionId)'
  })
  isCurrent!: boolean

  @ApiProperty({
    example: true,
    description: `
Indicates whether the session is currently active.

A session is considered active when:
- not revoked
- not expired
- not compromised
`
  })
  isActive!: boolean
}
