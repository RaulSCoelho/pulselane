'use client'

import { BrandLogo } from '@/components/brand/brand-logo'
import { nextClientApi } from '@/http/client-api-client'
import { DEFAULT_AUTHENTICATED_PATH, SIGNUP_PATH } from '@/lib/auth/auth-constants'
import { sanitizeRedirectTo } from '@/lib/auth/auth-redirect'
import { Button, Card, FieldError, Form, Input, Label, TextField, toast } from '@heroui/react'
import { ErrorResponse } from '@pulselane/contracts'
import { AuthResponse, loginRequestSchema } from '@pulselane/contracts/auth'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import z from 'zod'

type LoginFieldErrors = Partial<Record<'email' | 'password', string>>

export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})

  const redirectTo = sanitizeRedirectTo(searchParams.get('redirectTo'))

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const payload = {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? '')
    }

    const result = loginRequestSchema.safeParse(payload)

    if (!result.success) {
      const flattened = z.treeifyError(result.error).properties
      setFieldErrors({
        email: flattened?.email?.errors[0],
        password: flattened?.password?.errors[0]
      })
      return
    }

    setErrorMessage(null)
    setFieldErrors({})

    startTransition(async function submitLogin() {
      const response = await nextClientApi<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result.data)
      })

      if (!response.ok) {
        const body = (await response.json()) as ErrorResponse
        const nextMessage = Array.isArray(body?.message) ? body.message.join('\n') : (body.message ?? 'Unable to login')

        setErrorMessage(nextMessage)
        toast.danger(nextMessage)
        return
      }

      toast.success('Signed in successfully.')
      queryClient.clear()
      router.replace(redirectTo || DEFAULT_AUTHENTICATED_PATH)
      router.refresh()
    })
  }

  return (
    <Card className="w-full border border-border shadow-surface">
      <Card.Content className="flex min-w-0 flex-col gap-6 p-5 sm:p-8">
        <div className="flex flex-col items-center">
          <BrandLogo alt="Pulselane" className="h-auto max-w-32" priority />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-semibold tracking-normal">Sign in</h1>

          <p className="text-sm text-muted">Enter your account and continue to the operational workspace.</p>
        </div>

        <Form className="flex flex-col gap-4" onSubmit={handleSubmit} validationBehavior="aria">
          <TextField
            className="flex min-w-0 flex-col gap-2"
            isInvalid={Boolean(fieldErrors.email)}
            isRequired
            name="email"
          >
            <Label>Email</Label>
            <Input className="min-w-0" autoComplete="email" type="email" variant="secondary" />
            <FieldError>{fieldErrors.email}</FieldError>
          </TextField>

          <TextField
            className="flex min-w-0 flex-col gap-2"
            isInvalid={Boolean(fieldErrors.password)}
            isRequired
            name="password"
          >
            <Label>Password</Label>
            <Input className="min-w-0" autoComplete="current-password" type="password" variant="secondary" />
            <FieldError>{fieldErrors.password}</FieldError>
          </TextField>

          {errorMessage ? <p className="text-sm whitespace-pre-wrap text-danger">{errorMessage}</p> : null}

          <Button type="submit" isPending={isPending} size="lg" className="mt-2 w-full">
            Sign in
          </Button>
        </Form>

        <p className="text-sm text-muted">
          No account yet?{' '}
          <Link
            href={`${SIGNUP_PATH}?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-brand-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </Card.Content>
    </Card>
  )
}
