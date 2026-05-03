import { cn } from '@/lib/styles'
import { FieldError, Input, Label, ListBox, Select, TextArea, TextField } from '@heroui/react'
import type { InputHTMLAttributes, ReactNode } from 'react'

type BaseFieldProps = {
  label: ReactNode
  error?: ReactNode
  className?: string
  labelClassName?: string
}

type FormTextFieldProps = BaseFieldProps & {
  name: string
  defaultValue?: string
  isDisabled?: boolean
  isInvalid?: boolean
  isRequired?: boolean
  type?: InputHTMLAttributes<HTMLInputElement>['type']
  autoComplete?: string
  placeholder?: string
  multiline?: boolean
}

export function FormTextField({
  label,
  error,
  className,
  labelClassName,
  type = 'text',
  autoComplete,
  placeholder,
  multiline = false,
  isInvalid,
  ...textFieldProps
}: FormTextFieldProps) {
  return (
    <TextField
      className={cn('flex min-w-0 flex-col gap-2', className)}
      isInvalid={isInvalid ?? Boolean(error)}
      {...textFieldProps}
    >
      <Label className={labelClassName}>{label}</Label>
      {multiline ? (
        <TextArea className="min-w-0" placeholder={placeholder} variant="secondary" />
      ) : (
        <Input
          className="min-w-0"
          autoComplete={autoComplete}
          placeholder={placeholder}
          type={type}
          variant="secondary"
        />
      )}
      {error !== undefined ? <FieldError>{error}</FieldError> : null}
    </TextField>
  )
}

export type SelectFieldOption = {
  id: string
  label: string
}

type FormSelectFieldProps = BaseFieldProps & {
  name: string
  options: ReadonlyArray<SelectFieldOption>
  defaultValue?: string
  isDisabled?: boolean
  isInvalid?: boolean
  isRequired?: boolean
  placeholder?: string
}

export function FormSelectField({
  label,
  error,
  className,
  labelClassName,
  options,
  isInvalid,
  ...selectProps
}: FormSelectFieldProps) {
  return (
    <Select
      className={cn('flex min-w-0 flex-col gap-2', className)}
      isInvalid={isInvalid ?? Boolean(error)}
      variant="secondary"
      {...selectProps}
    >
      <Label className={labelClassName}>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map(option => (
            <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
      {error !== undefined ? <FieldError>{error}</FieldError> : null}
    </Select>
  )
}
