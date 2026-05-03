'use client'

import { BrandLogo } from '@/components/brand/brand-logo'
import { nextClientApi } from '@/http/client-api-client'
import { DEFAULT_AUTHENTICATED_PATH, LOGIN_PATH } from '@/lib/auth/auth-constants'
import { sanitizeRedirectTo } from '@/lib/auth/auth-redirect'
import { Button, Card, FieldError, Form, Input, Label, TextField, toast } from '@heroui/react'
import { ErrorResponse } from '@pulselane/contracts'
import { AuthResponse, signupRequestSchema } from '@pulselane/contracts/auth'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import z from 'zod'

type SignupFieldErrors = Partial<Record<'name' | 'email' | 'password' | 'organizationName', string>>

export function SignupForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({})

  const redirectTo = sanitizeRedirectTo(searchParams.get('redirectTo'))

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
      const flattened = z.treeifyError(result.error).properties
      setFieldErrors({
        name: flattened?.name?.errors[0],
        email: flattened?.email?.errors[0],
        password: flattened?.password?.errors[0],
        organizationName: flattened?.organizationName?.errors[0]
      })
      return
    }

    setErrorMessage(null)
    setFieldErrors({})

    startTransition(async function submitSignup() {
      const response = await nextClientApi<AuthResponse>('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result.data)
      })

      if (!response.ok) {
        const body = (await response.json()) as ErrorResponse
        const nextMessage = Array.isArray(body?.message)
          ? body.message.join('\n')
          : (body.message ?? 'Unable to create the account')

        setErrorMessage(nextMessage)
        toast.danger(nextMessage)
        return
      }

      toast.success('Account created successfully.')
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
          <h1 className="font-semibold tracking-normal">Create account</h1>

          <p className="text-sm text-muted">Create the account and start with your organization already created.</p>
        </div>

        <Form className="flex flex-col gap-4" onSubmit={handleSubmit} validationBehavior="aria">
          <TextField
            className="flex min-w-0 flex-col gap-2"
            isInvalid={Boolean(fieldErrors.name)}
            isRequired
            name="name"
          >
            <Label>Full name</Label>
            <Input className="min-w-0" autoComplete="name" type="text" variant="secondary" />
            <FieldError>{fieldErrors.name}</FieldError>
          </TextField>

          <TextField
            className="flex min-w-0 flex-col gap-2"
            isInvalid={Boolean(fieldErrors.organizationName)}
            isRequired
            name="organizationName"
          >
            <Label>Organization name</Label>
            <Input className="min-w-0" autoComplete="organization" type="text" variant="secondary" />
            <FieldError>{fieldErrors.organizationName}</FieldError>
          </TextField>

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
            <Input className="min-w-0" autoComplete="new-password" type="password" variant="secondary" />
            <FieldError>{fieldErrors.password}</FieldError>
          </TextField>

          {errorMessage ? <p className="text-sm whitespace-pre-wrap text-danger">{errorMessage}</p> : null}

          <Button type="submit" isPending={isPending} size="lg" className="mt-2 w-full">
            Create account
          </Button>
        </Form>

        <p className="text-sm text-muted">
          Already have an account?{' '}
          <Link
            href={`${LOGIN_PATH}?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-brand-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card.Content>
    </Card>
  )
}
