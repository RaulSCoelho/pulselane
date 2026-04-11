import { RefreshTokenPayload } from './refresh-token-payload'

export type RefreshRequestUser = RefreshTokenPayload & {
  refreshToken: string
  deviceId: string
}
