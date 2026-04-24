import { writeRequestSnapshot } from '@/lib/http/request-snapshot/server'
import { requestSnapshotScopeSchema } from '@/lib/http/request-snapshot/shared'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const persistSnapshotRequestSchema = z.object({
  requestUrl: z.string().min(1),
  method: z.string().min(1),
  payload: z.unknown(),
  maxAgeSeconds: z.number().int().nonnegative().optional(),
  scope: requestSnapshotScopeSchema.optional(),
  tags: z.array(z.string().min(1)).optional()
})

export async function POST(request: NextRequest) {
  const body = persistSnapshotRequestSchema.parse(await request.json())
  const response = new NextResponse(null, { status: 204 })

  await writeRequestSnapshot(response, body.requestUrl, body.payload, {
    method: body.method,
    maxAgeSeconds: body.maxAgeSeconds,
    scope: body.scope,
    tags: body.tags
  })

  return response
}
