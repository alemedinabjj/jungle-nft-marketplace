import type { Image } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'

const WIDTHS = [320, 640, 800] as const

function variant(src: string, width: number, format: 'avif' | 'webp'): string {
  return src.replace(/-\d+\.webp$/, `-${width}.${format}`)
}

interface NftImageProps {
  image: Image
  /** CSS `sizes` hint for the responsive candidates. */
  sizes: string
  priority?: boolean
  className?: string
  alt?: string
}

/**
 * Responsive AVIF/WebP artwork. Width/height are explicit and the box keeps its
 * aspect ratio, so images never cause layout shift.
 */
export function NftImage({ image, sizes, priority = false, className, alt }: NftImageProps) {
  const srcSet = (format: 'avif' | 'webp') =>
    WIDTHS.map((w) => `${variant(image.src, w, format)} ${w}w`).join(', ')
  return (
    <picture className="contents">
      <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
      <img
        src={image.src}
        srcSet={srcSet('webp')}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt={alt ?? image.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={cn('aspect-square h-auto w-full object-cover', className)}
      />
    </picture>
  )
}
