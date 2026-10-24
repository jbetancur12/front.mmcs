import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Dialog, InputBase, Typography } from '@mui/material'
import {
  ArrowForward,
  ChevronRight,
  History,
  SearchOutlined
} from '@mui/icons-material'

export interface CommandEntry {
  /** Identificador estable (la ruta). */
  id: string
  label: string
  path: string
  /** Grupos que contienen la opción, de afuera hacia adentro (Compras). */
  parents?: string[]
  /** Pista a la derecha, p. ej. la sección del menú. */
  hint?: string
  /** Sinónimos que también encuentran la opción aunque no estén en el nombre. */
  keywords?: string[]
  icon?: React.ReactNode
}

/** De dónde salió la opción elegida; sirve para medir si las sugerencias ayudan. */
export type CommandSource = 'search' | 'frequent' | 'recent'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  entries: CommandEntry[]
  /** Ids (rutas) de las más usadas y de las abiertas hace poco, para mostrar sin texto. */
  frequentIds?: string[]
  recentIds?: string[]
  onSelect: (entry: CommandEntry, source: CommandSource) => void
}

interface Row {
  entry: CommandEntry
  source: CommandSource
}

const GROUP_TITLES: Record<CommandSource, string> = {
  frequent: 'Más usadas',
  recent: 'Recientes',
  search: 'Ir a'
}

const MAX_RESULTS = 12

// Minúsculas y sin tildes, carácter por carácter para que los índices
// del texto original sigan valiendo al resaltar.
const fold = (text: string) =>
  [...text.toLowerCase()]
    .map((char) => char.normalize('NFD').charAt(0))
    .join('')

const tokensOf = (query: string) => fold(query).split(/\s+/).filter(Boolean)

/** Puntaje de una opción para la búsqueda; 0 si no coincide. */
const score = (entry: CommandEntry, tokens: string[]) => {
  const label = fold(entry.label)
  const context = fold(
    [
      ...(entry.parents ?? []),
      entry.hint ?? '',
      ...(entry.keywords ?? [])
    ].join(' ')
  )
  let total = 0
  for (const token of tokens) {
    const inLabel = label.indexOf(token)
    if (inLabel === 0) total += 4
    else if (inLabel > 0 && label[inLabel - 1] === ' ') total += 3
    else if (inLabel > 0) total += 2
    else if (context.includes(token)) total += 1
    else return 0
  }
  return total
}

const Highlighted: React.FC<{ text: string; tokens: string[] }> = ({
  text,
  tokens
}) => {
  const folded = fold(text)
  const marked = new Array<boolean>(text.length).fill(false)
  for (const token of tokens) {
    const at = folded.indexOf(token)
    if (at >= 0) marked.fill(true, at, at + token.length)
  }

  const parts: { value: string; on: boolean }[] = []
  ;[...text].forEach((char, index) => {
    const last = parts[parts.length - 1]
    if (last && last.on === marked[index]) last.value += char
    else parts.push({ value: char, on: marked[index] })
  })

  return (
    <>
      {parts.map((part, index) =>
        part.on ? (
          <Box
            key={index}
            component='mark'
            sx={{ bgcolor: '#E0F7F4', color: '#00695C', borderRadius: '3px' }}
          >
            {part.value}
          </Box>
        ) : (
          <React.Fragment key={index}>{part.value}</React.Fragment>
        )
      )}
    </>
  )
}

const KeyHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component='kbd'
    sx={{
      px: 0.75,
      py: 0.25,
      fontSize: 11,
      fontFamily: 'inherit',
      color: '#6b7280',
      bgcolor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px'
    }}
  >
    {children}
  </Box>
)

/**
 * Buscador global de pantallas (Ctrl+K): escribe y salta a cualquier opción
 * del menú que el usuario pueda ver. Sin texto muestra las visitadas hace poco.
 */
const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  entries,
  frequentIds = [],
  recentIds = [],
  onSelect
}) => {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  const tokens = useMemo(() => tokensOf(query), [query])

  const rows = useMemo<Row[]>(() => {
    if (tokens.length === 0) {
      const byId = (ids: string[], source: CommandSource): Row[] =>
        ids
          .map((id) => entries.find((entry) => entry.id === id))
          .filter((entry): entry is CommandEntry => Boolean(entry))
          .map((entry) => ({ entry, source }))
      return [
        ...byId(frequentIds, 'frequent'),
        ...byId(
          recentIds.filter((id) => !frequentIds.includes(id)),
          'recent'
        )
      ]
    }
    return entries
      .map((entry) => ({ entry, points: score(entry, tokens) }))
      .filter((row) => row.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, MAX_RESULTS)
      .map((row): Row => ({ entry: row.entry, source: 'search' }))
  }, [entries, frequentIds, recentIds, tokens])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [active, rows])

  const choose = (row: Row | undefined) => {
    if (!row) return
    onClose()
    onSelect(row.entry, row.source)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, rows.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(rows[active])
    }
  }

  const showingSuggestions = tokens.length === 0

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      aria-label='Búsqueda rápida'
      PaperProps={{
        sx: {
          position: 'absolute',
          top: { xs: 16, sm: '12vh' },
          m: { xs: 1, sm: 2 },
          width: { xs: 'calc(100% - 16px)', sm: '100%' },
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <SearchOutlined sx={{ color: '#9ca3af' }} />
        <InputBase
          autoFocus
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Buscar pantallas y opciones...'
          inputProps={{
            'aria-label': 'Buscar pantallas y opciones',
            role: 'combobox',
            'aria-expanded': true,
            'aria-controls': 'command-palette-list'
          }}
          sx={{ fontSize: 15 }}
        />
        <KeyHint>Esc</KeyHint>
      </Box>

      <Box sx={{ maxHeight: 360, overflowY: 'auto', p: 1 }}>
        {rows.length === 0 ? (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ px: 1.5, py: 3, textAlign: 'center' }}
          >
            {showingSuggestions
              ? 'Escribe para buscar una pantalla del menú.'
              : `Sin resultados para "${query.trim()}".`}
          </Typography>
        ) : (
          <>
            <Box
              component='ul'
              id='command-palette-list'
              role='listbox'
              ref={listRef}
              sx={{ listStyle: 'none', m: 0, p: 0 }}
            >
              {rows.map((row, index) => {
                const { entry, source } = row
                const selected = index === active
                const startsGroup =
                  index === 0 || rows[index - 1].source !== source
                return (
                  <React.Fragment key={entry.id}>
                    {startsGroup && (
                      <Typography
                        component='li'
                        role='presentation'
                        variant='caption'
                        sx={{
                          display: 'block',
                          px: 1.5,
                          pt: index === 0 ? 0.5 : 1.5,
                          pb: 0.75,
                          fontWeight: 600,
                          color: '#6b7280'
                        }}
                      >
                        {GROUP_TITLES[source]}
                      </Typography>
                    )}
                    <Box
                      component='li'
                      role='option'
                      aria-selected={selected}
                      onMouseMove={() => setActive(index)}
                      onClick={() => choose(row)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 1.5,
                        py: 1,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: 14,
                        bgcolor: selected ? '#f3f4f6' : 'transparent'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          color: '#6b7280',
                          '& svg': { fontSize: 18 }
                        }}
                      >
                        {source === 'recent' ? <History /> : entry.icon}
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          flex: 1,
                          minWidth: 0
                        }}
                      >
                        {entry.parents?.map((parent) => (
                          <React.Fragment key={parent}>
                            <Box component='span' sx={{ color: '#6b7280' }}>
                              <Highlighted text={parent} tokens={tokens} />
                            </Box>
                            <ChevronRight
                              sx={{ fontSize: 16, color: '#9ca3af' }}
                            />
                          </React.Fragment>
                        ))}
                        <Box component='span' sx={{ fontWeight: 500 }}>
                          <Highlighted text={entry.label} tokens={tokens} />
                        </Box>
                      </Box>
                      {entry.hint && !selected && (
                        <Typography
                          variant='caption'
                          sx={{
                            color: '#9ca3af',
                            display: { xs: 'none', sm: 'block' }
                          }}
                        >
                          {entry.hint}
                        </Typography>
                      )}
                      {selected && (
                        <ArrowForward sx={{ fontSize: 18, color: '#9ca3af' }} />
                      )}
                    </Box>
                  </React.Fragment>
                )
              })}
            </Box>
          </>
        )}
      </Box>

      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 1,
          bgcolor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          fontSize: 12,
          color: '#6b7280'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <KeyHint>↑</KeyHint>
          <KeyHint>↓</KeyHint>
          para moverte
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <KeyHint>Enter</KeyHint>
          para abrir
        </Box>
      </Box>
    </Dialog>
  )
}

export default CommandPalette
