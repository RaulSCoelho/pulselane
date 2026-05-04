'use client'

import { CreateRecordModal, type CreateRecordModalTriggerProps } from '@/components/ui/create-record-modal'
import { MailPlus } from 'lucide-react'

import { InvitationCreateForm } from './invitation-create-form'

export function InvitationCreateModal({
  triggerLabel = 'New invitation',
  triggerVariant = 'primary',
  triggerSize,
  triggerClassName,
  isDisabled
}: CreateRecordModalTriggerProps) {
  return (
    <CreateRecordModal
      title="Create invitation"
      description="Invite a user to the active organization with the correct role from the start."
      icon={<MailPlus aria-hidden="true" className="size-5" strokeWidth={1.8} />}
      iconTone="info"
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      triggerClassName={triggerClassName}
      isDisabled={isDisabled}
    >
      {({ close }) => <InvitationCreateForm onSuccess={close} />}
    </CreateRecordModal>
  )
}
