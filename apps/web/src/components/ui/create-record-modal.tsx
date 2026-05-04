'use client'

import { cn } from '@/lib/styles'
import { Button, Modal, useOverlayState } from '@heroui/react'
import { Plus } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

type CreateRecordModalTone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'cyan' | 'orange'

export type CreateRecordModalTriggerProps = {
  triggerLabel?: string
  triggerClassName?: string
  triggerVariant?: ComponentProps<typeof Button>['variant']
  triggerSize?: ComponentProps<typeof Button>['size']
  isDisabled?: boolean
}

type CreateRecordModalProps = CreateRecordModalTriggerProps & {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  iconTone?: CreateRecordModalTone
  dialogClassName?: string
  bodyClassName?: string
  children: (helpers: { close: () => void }) => ReactNode
}

const iconToneClassNames: Record<CreateRecordModalTone, string> = {
  accent: 'bg-accent/10 text-accent ring-1 ring-accent/20',
  success: 'bg-success/10 text-success ring-1 ring-success/20',
  warning: 'bg-warning/10 text-warning ring-1 ring-warning/20',
  danger: 'bg-danger/10 text-danger ring-1 ring-danger/20',
  info: 'bg-info/10 text-info ring-1 ring-info/20',
  cyan: 'bg-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/20',
  orange: 'bg-brand-orange/10 text-brand-orange ring-1 ring-brand-orange/20'
}

export function CreateRecordModal({
  title,
  description,
  icon,
  iconTone = 'accent',
  triggerLabel = 'Create',
  triggerClassName,
  triggerVariant = 'primary',
  triggerSize = 'md',
  isDisabled = false,
  dialogClassName,
  bodyClassName,
  children
}: CreateRecordModalProps) {
  const overlayState = useOverlayState()

  return (
    <>
      <Button
        className={triggerClassName}
        isDisabled={isDisabled}
        size={triggerSize}
        variant={triggerVariant}
        onPress={overlayState.open}
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={1.8} />
        {triggerLabel}
      </Button>

      <Modal.Backdrop isOpen={overlayState.isOpen} variant="blur" onOpenChange={overlayState.setOpen}>
        <Modal.Container placement="auto">
          <Modal.Dialog className={cn('sm:max-w-2xl', dialogClassName)}>
            <Modal.CloseTrigger />
            <Modal.Header>
              {icon ? <Modal.Icon className={iconToneClassNames[iconTone]}>{icon}</Modal.Icon> : null}
              <Modal.Heading>{title}</Modal.Heading>
              {description ? <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p> : null}
            </Modal.Header>
            <Modal.Body className={cn('p-5 sm:p-6', bodyClassName)}>
              {children({ close: overlayState.close })}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  )
}
