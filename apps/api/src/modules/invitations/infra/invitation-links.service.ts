import { EnvConfig } from '@/config/env.config'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class InvitationLinksService {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  buildAcceptInvitationUrl(token: string): string {
    const appWebUrl = this.configService.get('appWebUrl', { infer: true })
    const url = new URL('/invitations/accept', appWebUrl)

    url.searchParams.set('token', token)

    return url.toString()
  }
}
