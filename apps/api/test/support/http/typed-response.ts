import type { Response, Test } from 'supertest'

export type TypedResponse<TBody> = Omit<Response, 'body'> & {
  body: TBody
}

export async function expectTyped<TBody>(test: Test, expectedStatus: number): Promise<TypedResponse<TBody>> {
  const response = await test.expect(expectedStatus)
  return response as TypedResponse<TBody>
}
