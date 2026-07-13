import {useMemo, useState} from 'react'
import {Badge, Button, Card, Grid, Stack, Text} from '@sanity/ui'
import {useClient, useDocumentOperation, type DocumentActionComponent} from 'sanity'

/**
 * Project document action: pick any current Gallery image and reuse its
 * asset as the Homepage Thumbnail (no re-upload, gallery unchanged).
 * Edits the draft only — the normal Publish step still applies.
 */

const cdnUrl = (projectId: string, dataset: string, ref: string, w: number) => {
  // image-<sha1>-<WxH>-<ext>  ->  https://cdn.sanity.io/images/<pid>/<ds>/<sha1>-<WxH>.<ext>
  const m = ref.match(/^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/)
  if (!m) return null
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${m[1]}-${m[2]}.${m[3]}?w=${w}&h=${Math.round(w * 0.75)}&fit=crop&auto=format`
}

export const useAsThumbnailAction: DocumentActionComponent = (props) => {
  const doc = (props.draft ?? props.published) as any
  const {patch} = useDocumentOperation(props.id, props.type)
  const client = useClient({apiVersion: '2026-07-01'})
  const {projectId, dataset} = client.config()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const gallery: {key: string; ref: string; alt?: string}[] = useMemo(
    () =>
      ((doc?.gallery ?? []) as any[])
        .filter((g) => g?.image?.asset?._ref)
        .map((g) => ({key: g._key, ref: g.image.asset._ref, alt: g.alt})),
    [doc],
  )
  const currentThumbRef: string | undefined = doc?.homepageThumbnail?.asset?._ref

  if (props.type !== 'project') return null

  return {
    label: 'Use gallery image as thumbnail',
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'dialog',
      header: 'Use as Homepage Thumbnail',
      onClose: () => {
        setOpen(false)
        setSelected(null)
      },
      content: (
        <Stack space={4}>
          <Text size={1} muted>
            Pick a gallery image to reuse as the homepage thumbnail. The same asset is
            referenced — nothing is re-uploaded and the image stays in the gallery.
          </Text>
          {gallery.length === 0 && <Text size={1}>This project has no gallery images yet.</Text>}
          <Grid columns={3} gap={2}>
            {gallery.map((g) => {
              const url = dataset && projectId ? cdnUrl(projectId, dataset, g.ref, 240) : null
              const isCurrent = g.ref === currentThumbRef
              const isSelected = g.ref === selected
              return (
                <Card
                  key={g.key}
                  padding={1}
                  radius={2}
                  border
                  tone={isSelected ? 'positive' : isCurrent ? 'primary' : 'default'}
                  style={{cursor: 'pointer', outline: isSelected ? '2px solid #3b82f6' : 'none'}}
                  onClick={() => setSelected(g.ref)}
                >
                  <Stack space={2}>
                    {url && (
                      <img
                        src={url}
                        alt={g.alt ?? ''}
                        style={{width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block'}}
                      />
                    )}
                    {isCurrent && <Badge tone="primary">current thumbnail</Badge>}
                  </Stack>
                </Card>
              )
            })}
          </Grid>
          <Button
            text={selected ? 'Set as Homepage Thumbnail' : 'Select an image above'}
            tone="primary"
            disabled={!selected || selected === currentThumbRef}
            onClick={() => {
              if (!selected) return
              patch.execute([
                {set: {homepageThumbnail: {_type: 'image', asset: {_type: 'reference', _ref: selected}}}},
              ])
              setOpen(false)
              setSelected(null)
              props.onComplete()
            }}
          />
        </Stack>
      ),
    },
  }
}
