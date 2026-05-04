'use client'

import { CreateRecordModal, type CreateRecordModalTriggerProps } from '@/components/ui/create-record-modal'
import type { MembershipResponse } from '@pulselane/contracts/memberships'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import { ListPlus } from 'lucide-react'

import { TaskCreateForm } from './task-create-form'

type TaskCreateModalProps = CreateRecordModalTriggerProps & {
  projects: ProjectResponse[]
  memberships: MembershipResponse[]
}

export function TaskCreateModal({
  projects,
  memberships,
  triggerLabel = 'New task',
  triggerVariant = 'primary',
  triggerSize,
  triggerClassName,
  isDisabled
}: TaskCreateModalProps) {
  return (
    <CreateRecordModal
      title="Create task"
      description="Add operational work under a project, with priority, assignee and due date when needed."
      icon={<ListPlus aria-hidden="true" className="size-5" strokeWidth={1.8} />}
      iconTone="orange"
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      triggerClassName={triggerClassName}
      isDisabled={isDisabled || projects.length === 0}
      dialogClassName="sm:max-w-3xl"
    >
      {({ close }) => <TaskCreateForm projects={projects} memberships={memberships} onSuccess={close} />}
    </CreateRecordModal>
  )
}
