import {useCallback, useRef, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {
  insert,
  set,
  setIfMissing,
  PatchEvent,
  useClient,
  useFormValue,
  type ArrayOfObjectsInputProps,
} from 'sanity'

/**
 * Shared bulk-upload input for ordered image-object arrays
 * (project galleryImage[], place/imageStudy obsImage[]).
 * Renders a large multi-file drop zone above the normal array input, so
 * the default grid, drag-reorder, item dialogs, and Add Item all keep
 * working. Appends by default; Replace is a confirmed secondary action.
 */

const OK_EXT = /\.(jpe?g|png|webp|gif|avif)$/i
const OK_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
const CONCURRENCY = 4

const trailingSeq = (name: string): number | null => {
  const m = name.replace(/\.[^.]+$/, '').match(/(\d+)\s*$/)
  return m ? parseInt(m[1], 10) : null
}

const newKey = () => `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`

export function BulkImageArrayInput(props: ArrayOfObjectsInputProps) {
  const client = useClient({apiVersion: '2026-07-01'})
  const docTitle = (useFormValue(['title']) as string | undefined) ?? 'Untitled'
  const memberType = props.schemaType.of[0]?.name ?? 'galleryImage'
  const fileInput = useRef<HTMLInputElement>(null)
  const replaceNext = useRef(false)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [failures, setFailures] = useState<string[]>([])
  const [unnumbered, setUnnumbered] = useState<string[]>([])

  const handleFiles = useCallback(
    async (incoming: File[], mode: 'append' | 'replace') => {
      const valid = incoming.filter((f) => OK_EXT.test(f.name) || OK_MIME.has(f.type))
      const rejected = incoming.filter((f) => !valid.includes(f))
      setFailures(rejected.map((f) => `${f.name} — unsupported format, convert to JPEG, PNG, or WebP`))

      /* Sort only this batch by trailing number (natural numeric order,
         extension and file date ignored). Un-numbered files keep their
         picker order and follow the numbered ones. */
      const numbered = valid
        .filter((f) => trailingSeq(f.name) !== null)
        .sort((a, b) => (trailingSeq(a.name) as number) - (trailingSeq(b.name) as number))
      const others = valid.filter((f) => trailingSeq(f.name) === null)
      setUnnumbered(others.map((f) => f.name))
      const ordered = [...numbered, ...others]
      if (ordered.length === 0) {
        setStatus(rejected.length ? 'No valid images in that selection.' : null)
        return
      }

      if (mode === 'replace') {
        const current = props.value?.length ?? 0
        const ok = window.confirm(
          `Replace the current gallery (${current} item${current === 1 ? '' : 's'}) with ${ordered.length} new image${ordered.length === 1 ? '' : 's'}?\n\nExisting Sanity assets are kept in the media library; only this gallery's references change.`,
        )
        if (!ok) return
      }

      setBusy(true)
      const assetByFile = new Map<File, string>()
      let done = 0
      const queue = [...ordered]
      setStatus(`Uploading 0 / ${ordered.length}…`)
      await Promise.all(
        Array.from({length: Math.min(CONCURRENCY, queue.length)}, async () => {
          for (let f = queue.shift(); f; f = queue.shift()) {
            try {
              const asset = await client.assets.upload('image', f, {filename: f.name})
              assetByFile.set(f, asset._id)
            } catch {
              setFailures((prev) => [...prev, `${f.name} — upload failed`])
            }
            done += 1
            setStatus(`Uploading ${done} / ${ordered.length}…`)
          }
        }),
      )

      const startIndex = mode === 'replace' ? 0 : props.value?.length ?? 0
      const uploaded = ordered.filter((f) => assetByFile.has(f))
      const items = uploaded.map((f, i) => ({
        _key: newKey(),
        _type: memberType,
        image: {_type: 'image', asset: {_type: 'reference', _ref: assetByFile.get(f) as string}},
        /* Temporary neutral alt — the item preview flags it for review. */
        alt: `${docTitle}, image ${String(startIndex + i + 1).padStart(2, '0')}`,
      }))
      if (items.length > 0) {
        props.onChange(
          mode === 'replace'
            ? PatchEvent.from(set(items))
            : PatchEvent.from([setIfMissing([]), insert(items, 'after', [-1])]),
        )
      }
      setBusy(false)
      setStatus(
        `${items.length} image${items.length === 1 ? '' : 's'} ${mode === 'replace' ? 'set' : 'added'} — review alt text, then Publish once when done.`,
      )
    },
    [client, docTitle, memberType, props],
  )

  const openPicker = useCallback((mode: 'append' | 'replace') => {
    replaceNext.current = mode === 'replace'
    fileInput.current?.click()
  }, [])

  return (
    <Stack space={3}>
      <Card
        padding={4}
        radius={2}
        border
        tone={dragOver ? 'positive' : 'primary'}
        style={{borderStyle: 'dashed', cursor: busy ? 'progress' : 'pointer'}}
        onClick={() => !busy && openPicker('append')}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (!busy) handleFiles(Array.from(e.dataTransfer.files), 'append')
        }}
      >
        <Stack space={3} style={{textAlign: 'center'}}>
          <Text size={2} weight="semibold">
            Drop multiple images here
          </Text>
          <Text size={1} muted>
            or choose multiple images — they upload together and append after the current items
          </Text>
          <Flex justify="center" gap={2}>
            <Button
              text="Choose multiple images"
              tone="primary"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation()
                openPicker('append')
              }}
            />
            <Button
              text="Replace gallery…"
              mode="ghost"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation()
                openPicker('replace')
              }}
            />
          </Flex>
        </Stack>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/jpeg,image/png,image/webp,image/gif,image/avif"
          style={{display: 'none'}}
          aria-label="Choose multiple images to upload"
          onChange={(e) => {
            const files = Array.from(e.currentTarget.files ?? [])
            e.currentTarget.value = ''
            if (files.length) handleFiles(files, replaceNext.current ? 'replace' : 'append')
            replaceNext.current = false
          }}
        />
      </Card>

      {(status || failures.length > 0 || unnumbered.length > 0) && (
        <Stack space={2} role="status" aria-live="polite">
          {status && (
            <Text size={1} muted>
              {status}
            </Text>
          )}
          {failures.map((f) => (
            <Flex key={f} gap={2} align="center">
              <Badge tone="critical">skipped</Badge>
              <Text size={1}>{f}</Text>
            </Flex>
          ))}
          {unnumbered.length > 0 && (
            <Text size={1} muted>
              No sequence number (kept in picker order): {unnumbered.join(', ')}
            </Text>
          )}
        </Stack>
      )}

      {/* Normal array input: grid layout, drag-reorder, item dialogs,
          and the Add Item fallback all stay native. */}
      <Box>{props.renderDefault(props)}</Box>
    </Stack>
  )
}
