import { cn } from '@/lib/styles'
import darkLogo from '@pulselane/assets/dark_logo.png'
import horizontalLogo from '@pulselane/assets/horizontal_logo.png'
import symbolLogo from '@pulselane/assets/symbol.png'
import Image from 'next/image'

type BrandLogoProps = {
  variant?: 'horizontal' | 'dark' | 'symbol'
  alt?: string
  className?: string
  priority?: boolean
}

const logoAssets = {
  horizontal: horizontalLogo,
  dark: darkLogo,
  symbol: symbolLogo
}

export function BrandLogo({ variant = 'horizontal', alt = 'Pulselane', className, priority = false }: BrandLogoProps) {
  const asset = logoAssets[variant]
  const isSymbol = variant === 'symbol'

  return (
    <Image
      src={asset}
      alt={alt}
      className={cn(isSymbol ? 'size-8 object-contain' : 'h-8 w-auto object-contain', className)}
      priority={priority}
      sizes={isSymbol ? '32px' : '180px'}
    />
  )
}
