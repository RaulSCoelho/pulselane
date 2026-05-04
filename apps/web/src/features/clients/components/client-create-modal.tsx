'use client'

import { CreateRecordModal, type CreateRecordModalTriggerProps } from '@/components/ui/create-record-modal'
import { Users } from 'lucide-react'

import { ClientCreateForm } from './client-create-form'

export function ClientCreateModal({
  triggerLabel = 'New client',
  triggerVariant = 'primary',
  triggerSize,
  triggerClassName,
  isDisabled
}: CreateRecordModalTriggerProps) {
  return (
    <CreateRecordModal
      title="Create client"
      description="Add an operational entity that can own projects and task execution."
      icon={<Users aria-hidden="true" className="size-5" strokeWidth={1.8} />}
      iconTone="accent"
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      triggerClassName={triggerClassName}
      isDisabled={isDisabled}
    >
      {({ close }) => <ClientCreateForm onSuccess={close} />}
    </CreateRecordModal>
  )
}
