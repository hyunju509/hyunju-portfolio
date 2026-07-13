import {useCallback, useRef, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {set, PatchEvent, useClient, type ObjectInputProps} from 'sanity'

/**
 * Shared single-image input: one obvious drop/click zone that uploads a
 * file and sets the field directly — no nested dialogs to replace an
 * image. The normal Sanity image input renders below it, so preview,
 * hotspot, and crop tools stay native.
 */

const OK_EXT = /\.(jpe?g|png|webp|gif|avif)$/i
const OK_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

export function DropImageInput(props: ObjectInputProps) {
  const client = useClient({apiVersion: '2026-07-01'})
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const hasImage = Boolean((props.value as any)?.asset?._ref)

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      if (!(OK_EXT.test(file.name) || OK_MIME.has(file.type))) {
        setMessage(`${file.name} — unsupported format, convert to JPEG, PNG, or WebP`)
        return
      }
      setBusy(true)
      setMessage(`Uploading ${file.name}…`)
      try {
        const asset = await client.assets.upload('image', file, {filename: file.name})
        /* Replaces the whole image value (a new image gets a fresh
           hotspot/crop, editable below as usual). */
        props.onChange(
          PatchEvent.from(set({_type: 'image', asset: {_type: 'reference', _ref: asset._id}})),
        )
        setMessage('Image set — adjust hotspot/crop below if needed.')
      } catch {
        setMessage(`${file.name} — upload failed`)
      }
      setBusy(false)
    },
    [client, props],
  )

  return (
    <Stack space={3}>
      <Card
        padding={3}
        radius={2}
        border
        tone={dragOver ? 'positive' : 'transparent'}
        style={{borderStyle: 'dashed', cursor: busy ? 'progress' : 'pointer'}}
        onClick={() => !busy && fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (!busy) handleFile(e.dataTransfer.files?.[0])
        }}
      >
        <Flex align="center" justify="space-between" gap={3}>
          <Text size={1} muted>
            {hasImage ? 'Drop a new image here to replace' : 'Drop an image here'} — or
          </Text>
          <Button
            text={hasImage ? 'Choose replacement' : 'Choose image'}
            mode="ghost"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation()
              fileInput.current?.click()
            }}
          />
        </Flex>
        <input
          ref={fileInput}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/jpeg,image/png,image/webp,image/gif,image/avif"
          style={{display: 'none'}}
          aria-label="Choose an image to upload"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0]
            e.currentTarget.value = ''
            handleFile(file)
          }}
        />
      </Card>
      {message && (
        <Flex gap={2} align="center" role="status" aria-live="polite">
          {message.includes('unsupported') || message.includes('failed') ? (
            <Badge tone="critical">error</Badge>
          ) : null}
          <Text size={1} muted>
            {message}
          </Text>
        </Flex>
      )}
      <Box>{props.renderDefault(props)}</Box>
    </Stack>
  )
}
