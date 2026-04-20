'use client'

import { sanitizeRedirectTo } from '@/lib/auth/auth-redirect'
import { DEFAULT_AUTHENTICATED_PATH, SIGNUP_PATH } from '@/lib/auth/auth.constants'
import { Button, Card, Input, Label, TextField } from '@heroui/react'
import { loginRequestSchema } from '@pulselane/contracts/auth'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const redirectTo = useMemo(() => {
    return sanitizeRedirectTo(searchParams.get('redirectTo'))
  }, [searchParams])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const payload = {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? '')
    }

    const result = loginRequestSchema.safeParse(payload)

    if (!result.success) {
      setErrorMessage('Invalid email or password format')
      return
    }

    setErrorMessage(null)

    startTransition(async function submitLogin() {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(result.data)
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)

        setErrorMessage(body?.message ?? 'Unable to login')
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Login</h1>

          <p className="text-sm text-zinc-600">Enter your account and continue to the operational workspace.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField className="flex flex-col gap-2" isRequired name="email">
            <Label>Email</Label>
            <Input autoComplete="email" type="email" variant="secondary" />
          </TextField>

          <TextField className="flex flex-col gap-2" isRequired name="password">
            <Label>Password</Label>
            <Input autoComplete="current-password" type="password" variant="secondary" />
          </TextField>

          {errorMessage ? (
            <p role="alert" className="text-sm text-danger">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" isPending={isPending} size="lg" className="mt-2">
            Sign in
          </Button>
        </form>

        <p className="text-sm text-zinc-600">
          No account yet?{' '}
          <Link
            href={`${SIGNUP_PATH}?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </Card.Content>
    </Card>
  )
}
