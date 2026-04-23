import { writeRequestSnapshot } from '@/lib/http/request-snapshot/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const persistSnapshotRequestSchema = z.object({
  requestUrl: z.string().min(1),
  method: z.string().min(1),
  payload: z.unknown()
})

export async function POST(request: NextRequest) {
  const body = persistSnapshotRequestSchema.parse(await request.json())
  const response = new NextResponse(null, { status: 204 })

  await writeRequestSnapshot(response, body.requestUrl, body.payload, body.method)

  return response
}
