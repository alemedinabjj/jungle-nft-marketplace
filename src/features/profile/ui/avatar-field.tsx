import { ImageIcon } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import type { User } from '@/shared/contracts'
import { isAppError } from '@/shared/http'
import { useAnnounce } from '@/shared/ui/live-region'
import { checkAvatarFile } from '../model/avatar'
import { useRemoveAvatar, useSetAvatar } from '../queries/profile-queries'

/** Downscale to a 256px square WebP data URL before the (simulated) upload. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponível')
  const side = Math.min(bitmap.width, bitmap.height)
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  )
  return canvas.toDataURL('image/webp', 0.85)
}

export function AvatarField({ user }: { user: User }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const setAvatar = useSetAvatar()
  const removeAvatar = useRemoveAvatar()
  const announce = useAnnounce()
  const [error, setError] = useState<string | null>(null)
  const busy = setAvatar.isPending || removeAvatar.isPending

  const onFile = async (file: File | undefined) => {
    setError(null)
    if (!file) return
    const check = checkAvatarFile(file)
    if (!check.ok) {
      setError(check.message)
      return
    }
    try {
      await setAvatar.mutateAsync(await toAvatarDataUrl(file))
      announce('Avatar atualizado.')
    } catch (cause) {
      setError(
        isAppError(cause)
          ? (cause.fieldErrors?.dataUrl ?? cause.message)
          : 'Não foi possível processar a imagem.',
      )
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-body font-medium text-text-secondary">
        Avatar
      </span>
      <div className="flex items-center gap-6" aria-labelledby={`${id}-label`} role="group">
        <span className="flex size-[50px] items-center justify-center overflow-hidden rounded-md border border-border bg-ink">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Seu avatar atual"
              width={50}
              height={50}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon aria-hidden="true" className="size-6 text-text-secondary" />
          )}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => void onFile(event.target.files?.[0])}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <label
          htmlFor={id}
          className="cursor-pointer text-body font-bold text-text-accent hover:underline has-[+_*]:outline-none"
        >
          {setAvatar.isPending ? 'Enviando…' : 'Alterar'}
        </label>
        {user.avatarUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => removeAvatar.mutate(undefined, { onSuccess: () => announce('Avatar removido.') })}
            className="text-body text-text-secondary hover:text-text-primary"
          >
            Remover
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
