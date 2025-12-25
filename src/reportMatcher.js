function normalizeHash(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const hexOnly = trimmed.replace(/[^0-9a-fA-F]/g, '')
  if (!hexOnly) return null
  return hexOnly.toLowerCase()
}

function expectedHashLength(key) {
  if (key === 'md5') return 32
  if (key === 'sha1') return 40
  if (key === 'sha256') return 64
  if (key === 'sha512') return 128
  return null
}

function truncateToExpected(key, hex) {
  const expected = expectedHashLength(key)
  if (!expected || typeof hex !== 'string') return hex
  if (hex.length <= expected) return hex
  return hex.slice(0, expected)
}

function toEntry(raw) {
  if (!raw || typeof raw !== 'object') return null

  const filename = typeof raw.filename === 'string' ? raw.filename.trim() : ''
  if (!filename) return null

  const entry = {
    filename,
    md5: normalizeHash(raw.md5),
    sha1: normalizeHash(raw.sha1),
    sha256: normalizeHash(raw.sha256),
    sha512: normalizeHash(raw.sha512)
  }

  if (!entry.md5 && !entry.sha1 && !entry.sha256 && !entry.sha512) return null
  return entry
}

function indexByFilename(entries) {
  const map = new Map()
  for (const entry of entries) {
    if (!entry?.filename) continue
    map.set(entry.filename, entry)
  }
  return map
}

function parseJsonReport(text) {
  const parsed = JSON.parse(text)

  if (Array.isArray(parsed)) {
    const entries = parsed.map(toEntry).filter(Boolean)
    return indexByFilename(entries)
  }

  if (parsed && typeof parsed === 'object') {
    const maybeArray = Array.isArray(parsed.files)
      ? parsed.files
      : Array.isArray(parsed.entries)
        ? parsed.entries
        : null

    if (maybeArray) {
      const entries = maybeArray.map(toEntry).filter(Boolean)
      return indexByFilename(entries)
    }

    const single = toEntry(parsed)
    if (single) return indexByFilename([single])
  }

  return new Map()
}

function parseTextReport(text) {
  const content = String(text ?? '')

  /** @type {Map<string, any>} */
  const entries = new Map()

  const ensure = (filename) => {
    if (!entries.has(filename)) {
      entries.set(filename, { filename, md5: null, sha1: null, sha256: null, sha512: null })
    }
    return entries.get(filename)
  }

  const cleanFilename = (raw) => {
    if (typeof raw !== 'string') return ''
    const s = raw.trim()
    if (!s) return ''
    return s.split(/\s+(Type|Size)\s*:/i)[0].trim()
  }

  const readHexForward = (startIndex) => {
    let i = startIndex
    while (i < content.length && /\s/.test(content[i])) i += 1

    let hex = ''
    while (i < content.length) {
      const ch = content[i]
      if (/[0-9a-fA-F]/.test(ch)) {
        hex += ch
        i += 1
        continue
      }
      if (/\s/.test(ch)) {
        i += 1
        continue
      }

      break
    }

    return normalizeHash(hex)
  }

  const fileHeaderRe = /\b(Filename|File)\s*:\s*/gi
  const fileHeaders = []
  let m
  while ((m = fileHeaderRe.exec(content))) {
    fileHeaders.push({ index: m.index, after: m.index + m[0].length })
  }

  for (let idx = 0; idx < fileHeaders.length; idx += 1) {
    const start = fileHeaders[idx].after
    const end = idx + 1 < fileHeaders.length ? fileHeaders[idx + 1].index : content.length
    const block = content.slice(start, end)

    const firstLine = block.split(/\r?\n/)[0] ?? ''
    const filename = cleanFilename(firstLine)
    if (!filename) continue

    const entry = ensure(filename)

    const labelRe = /\b(SHA-256|SHA-512|SHA-1|MD5)\s*:\s*/gi
    let lm
    while ((lm = labelRe.exec(block))) {
      const label = lm[1].toUpperCase()
      const absoluteStart = start + lm.index + lm[0].length
      const hex = readHexForward(absoluteStart)
      if (!hex) continue

      if (label === 'MD5') entry.md5 = truncateToExpected('md5', hex)
      else if (label === 'SHA-1') entry.sha1 = truncateToExpected('sha1', hex)
      else if (label === 'SHA-256') entry.sha256 = truncateToExpected('sha256', hex)
      else if (label === 'SHA-512') entry.sha512 = truncateToExpected('sha512', hex)
    }
  }

  if (entries.size === 0) {
    const lines = content.split(/\r?\n/)
    let currentFilename = null
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue

      const filenameMatch = /^(Filename|File)\s*:\s*(.+)$/i.exec(line)
      if (filenameMatch) {
        currentFilename = cleanFilename(filenameMatch[2])
        if (currentFilename) ensure(currentFilename)
        continue
      }
      if (!currentFilename) continue

      const hashMatch = /^(SHA-256|SHA-512|SHA-1|MD5)\s*:\s*(.+)$/i.exec(line)
      if (!hashMatch) continue

      const label = hashMatch[1].toUpperCase()
      const hex = normalizeHash(hashMatch[2])
      if (!hex) continue

      const entry = ensure(currentFilename)
      if (label === 'MD5') entry.md5 = truncateToExpected('md5', hex)
      else if (label === 'SHA-1') entry.sha1 = truncateToExpected('sha1', hex)
      else if (label === 'SHA-256') entry.sha256 = truncateToExpected('sha256', hex)
      else if (label === 'SHA-512') entry.sha512 = truncateToExpected('sha512', hex)
    }
  }

  for (const [name, entry] of entries.entries()) {
    if (!entry.md5 && !entry.sha1 && !entry.sha256 && !entry.sha512) entries.delete(name)
  }

  return entries
}

export function parsePreviousReport(text) {
  const trimmed = String(text ?? '').trim()
  if (!trimmed) {
    return { entriesByFilename: new Map(), format: 'unknown' }
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return { entriesByFilename: parseJsonReport(trimmed), format: 'json' }  
  }

  return { entriesByFilename: parseTextReport(trimmed), format: 'txt' }
}

export const parsePrevReport = parsePreviousReport

export function compCurrToPrev({ currentItems, prevByFilename, previousByFilename }) {
  const integrityById = {}

  const prevMap = prevByFilename ?? previousByFilename

  const currNames = new Set()
  let verified = 0
  let tampered = 0
  let newFiles = 0
  let unknown = 0

  const algoKeys = ['sha256', 'sha512', 'sha1', 'md5']

  for (const item of currentItems) {
    const current = item?.result
    const filename = current?.filename || item?.file?.name
    if (!filename) continue

    currNames.add(filename)

    const prev = prevMap?.get?.(filename) ?? null
    if (!prev) {
      integrityById[item.id] = { state: 'new', filename }
      newFiles += 1
      continue
    }

    let compared = 0
    let matched = 0
    const mismatches = {}

    for (const key of algoKeys) {
      const prevHash = normalizeHash(prev[key])
      const curHash = normalizeHash(current[key])
      if (!prevHash || !curHash) continue

      compared += 1
      if (prevHash === curHash) {
        matched += 1
      } else {
        mismatches[key] = { previous: prevHash, current: curHash }
      }
    }

    let state
    if (compared === 0) state = 'unknown'
    else state = matched === compared ? 'verified' : 'tampered'
    integrityById[item.id] = {
      state,
      filename,
      compared,
      matched,
      mismatches,
      previous: {
        md5: prev.md5 ?? null,
        sha1: prev.sha1 ?? null,
        sha256: prev.sha256 ?? null,
        sha512: prev.sha512 ?? null
      }
    }

    if (state === 'verified') verified += 1
    else tampered += 1
    if (state === 'unknown') unknown += 1
  }

  const missFromCurr = []
  if (prevMap?.forEach) {
    prevMap.forEach((_value, filename) => {
      if (!currNames.has(filename)) missFromCurr.push(filename)
    })
  }

  return {
    integrityById,
    summary: {
      verified,
      tampered,
      newFiles,
      missing: missFromCurr.length,
      unknown
    },
    missFromCurr
  }
}
