import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

function isTextItem(item) {
  return item && typeof item.str === 'string' && item.transform && item.transform.length >= 6
}

function groupTextItemsIntoLines(items) {
  // Group by Y coordinate (rounded) and order by page reading order.
  /** @type {Map<number, Array<{x:number, str:string}>>} */
  const byY = new Map()

  for (const item of items) {
    if (!isTextItem(item)) continue
    const str = item.str.trim()
    if (!str) continue

    const x = Number(item.transform[4])
    const y = Number(item.transform[5])

    const key = Math.round(y)

    if (!byY.has(key)) byY.set(key, [])
    byY.get(key).push({ x: Number.isFinite(x) ? x : 0, str })
  }

  const ys = Array.from(byY.keys()).sort((a, b) => b - a)
  const lines = []

  for (const y of ys) {
    const parts = byY.get(y)
    parts.sort((a, b) => a.x - b.x)

    let line = parts.map(p => p.str).join(' ')
    line = line.replace(/\s+/g, ' ').trim()
    if (line) lines.push(line)
  }

  return lines
}

export async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)

  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await loadingTask.promise

  const pages = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const lines = groupTextItemsIntoLines(content.items)
    pages.push(lines.join('\n'))
  }

  return pages.join('\n\n')
}
