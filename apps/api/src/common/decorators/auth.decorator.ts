import { SetMetadata } from '@nestjs/common'

export const AUTH_OPTIONS_KEY = 'authOptions'

export type AuthMode = 'private' | 'public' | 'optional'

export type AuthOptions = {
  mode?: AuthMode
}

export function Auth(options: AuthOptions = {}) {
  return SetMetadata(AUTH_OPTIONS_KEY, {
    mode: options.mode ?? 'private'
  } satisfies Required<AuthOptions>)
}
