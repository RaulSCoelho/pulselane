export type RefreshTokenPayload = {
  sub: string
  sid: string
  did: string
  jti: string
  typ: 'refresh'
}
