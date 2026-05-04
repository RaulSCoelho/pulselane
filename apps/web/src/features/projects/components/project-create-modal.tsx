'use client'

import { CreateRecordModal, type CreateRecordModalTriggerProps } from '@/components/ui/create-record-modal'
import type { ClientResponse } from '@pulselane/contracts/clients'
import { FolderPlus } from 'lucide-react'

import { ProjectCreateForm } from './project-create-form'

type ProjectCreateModalProps = CreateRecordModalTriggerProps & {
  clients: ClientResponse[]
}

export function ProjectCreateModal({
  clients,
  triggerLabel = 'New project',
  triggerVariant = 'primary',
  triggerSize,
  triggerClassName,
  isDisabled
}: ProjectCreateModalProps) {
  return (
    <CreateRecordModal
      title="Create project"
      description="Connect client work to a clear operational project before tasks are created."
      icon={<FolderPlus aria-hidden="true" className="size-5" strokeWidth={1.8} />}
      iconTone="cyan"
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      triggerClassName={triggerClassName}
      isDisabled={isDisabled || clients.length === 0}
    >
      {({ close }) => <ProjectCreateForm clients={clients} onSuccess={close} />}
    </CreateRecordModal>
  )
}
