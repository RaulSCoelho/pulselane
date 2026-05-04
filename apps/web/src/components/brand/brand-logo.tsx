import { cn } from '@/lib/styles'
import darkLogo from '@pulselane/assets/logo-dark.svg'
import horizontalLogo from '@pulselane/assets/logo.svg'
import symbolLogo from '@pulselane/assets/symbol.svg'
import Image from 'next/image'

type BrandLogoProps = {
  variant?: 'horizontal' | 'dark' | 'symbol'
  alt?: string
  className?: string
  priority?: boolean
}

const logoAssets = {
  horizontal: { src: horizontalLogo, width: 757, height: 216 },
  dark: { src: darkLogo, width: 790, height: 247 },
  symbol: { src: symbolLogo, width: 457, height: 427 }
}

export function BrandLogo({ variant = 'horizontal', alt = 'Pulselane', className, priority = false }: BrandLogoProps) {
  const asset = logoAssets[variant]
  const isSymbol = variant === 'symbol'

  return (
    <Image
      src={asset.src}
      alt={alt}
      width={asset.width}
      height={asset.height}
      className={cn(isSymbol ? 'size-8 object-contain' : 'h-8 w-auto object-contain', className)}
      priority={priority}
      sizes={isSymbol ? '32px' : '180px'}
    />
  )
}
