import type { SignupDto } from '@/modules/auth/dto/requests/signup.dto'
import type { CreateClientDto } from '@/modules/clients/dto/requests/create-client.dto'
import type { CreateProjectDto } from '@/modules/projects/dto/requests/create-project.dto'
import type { CreateTaskDto } from '@/modules/tasks/dto/requests/create-task.dto'

import { TEST_DEFAULTS } from '../fixtures/defaults'

let uniqueCounter = 0

export function uniqueText(prefix: string): string {
  uniqueCounter += 1
  return `${prefix}-${Date.now()}-${uniqueCounter}`
}

export function uniqueEmail(prefix = 'user'): string {
  return `${uniqueText(prefix)}@example.com`
}

export function buildSignupDto(overrides: Partial<SignupDto> = {}): SignupDto {
  return {
    name: overrides.name ?? TEST_DEFAULTS.userName,
    email: overrides.email ?? uniqueEmail('signup'),
    password: overrides.password ?? TEST_DEFAULTS.password,
    organizationName: overrides.organizationName ?? `${TEST_DEFAULTS.organizationName} ${uniqueText('org')}`
  }
}

export function buildCreateClientDto(overrides: Partial<CreateClientDto> = {}): CreateClientDto {
  return {
    name: overrides.name ?? `${TEST_DEFAULTS.clientName} ${uniqueText('client')}`,
    email: overrides.email ?? uniqueEmail('client'),
    companyName: overrides.companyName ?? `${TEST_DEFAULTS.clientName} LLC`,
    status: overrides.status
  }
}

export function buildCreateProjectDto(clientId: string, overrides: Partial<CreateProjectDto> = {}): CreateProjectDto {
  return {
    clientId,
    name: overrides.name ?? `${TEST_DEFAULTS.projectName} ${uniqueText('project')}`,
    description: overrides.description,
    status: overrides.status
  }
}

export function buildCreateTaskDto(projectId: string, overrides: Partial<CreateTaskDto> = {}): CreateTaskDto {
  return {
    projectId,
    title: overrides.title ?? `${TEST_DEFAULTS.taskTitle} ${uniqueText('task')}`,
    description: overrides.description,
    assigneeUserId: overrides.assigneeUserId,
    status: overrides.status,
    priority: overrides.priority,
    dueDate: overrides.dueDate
  }
}
