'use client'

import { api } from '@/http/api-client'
import { DEFAULT_AUTHENTICATED_PATH, LOGIN_PATH } from '@/lib/auth/auth-constants'
import { sanitizeRedirectTo } from '@/lib/auth/auth-redirect'
import { Button, Card, Input, Label, TextField } from '@heroui/react'
import { ErrorResponse } from '@pulselane/contracts'
import { AuthResponse, signupRequestSchema } from '@pulselane/contracts/auth'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const redirectTo = useMemo(() => sanitizeRedirectTo(searchParams.get('redirectTo')), [searchParams])

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const payload = {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      organizationName: String(formData.get('organizationName') ?? '')
    }

    const result = signupRequestSchema.safeParse(payload)

    if (!result.success) {
      setErrorMessage('Check the fields and try again')
      return
    }

    setErrorMessage(null)

    startTransition(async function submitSignup() {
      const response = await api<AuthResponse>('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result.data)
      })

      if (!response.ok) {
        const body = (await response.json()) as ErrorResponse
        setErrorMessage(
          Array.isArray(body?.message) ? body.message.join('\n') : (body.message ?? 'Unable to create the account')
        )
        return
      }

      router.replace(redirectTo || DEFAULT_AUTHENTICATED_PATH)
      router.refresh()
    })
  }

  return (
    <Card className="w-full max-w-md border border-black/5 shadow-sm">
      <Card.Content className="flex flex-col gap-6 p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Signup</h1>

          <p className="text-sm text-zinc-600">Create the account and start with your organization already created.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField className="flex flex-col gap-2" isRequired name="name">
            <Label>Full name</Label>
            <Input autoComplete="name" type="text" variant="secondary" />
          </TextField>

          <TextField className="flex flex-col gap-2" isRequired name="organizationName">
            <Label>Organization name</Label>
            <Input autoComplete="organization" type="text" variant="secondary" />
          </TextField>

          <TextField className="flex flex-col gap-2" isRequired name="email">
            <Label>Email</Label>
            <Input autoComplete="email" type="email" variant="secondary" />
          </TextField>

          <TextField className="flex flex-col gap-2" isRequired name="password">
            <Label>Password</Label>
            <Input autoComplete="new-password" type="password" variant="secondary" />
          </TextField>

          {errorMessage ? (
            <p role="alert" className="text-sm text-danger whitespace-pre-wrap">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" isPending={isPending} size="lg" className="mt-2">
            Create account
          </Button>
        </form>

        <p className="text-sm text-zinc-600">
          Already have an account?{' '}
          <Link
            href={`${LOGIN_PATH}?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card.Content>
    </Card>
  )
}
