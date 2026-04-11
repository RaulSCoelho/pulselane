import { Prisma } from '@prisma/client'

export type SendEmailInput = {
  organizationId: string
  sentBy?: string | null
  to: string
  subject: string
  html: string
  text: string
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
}
