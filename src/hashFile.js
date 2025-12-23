import { createMD5, createSHA1, createSHA256, createSHA512 } from 'hash-wasm'

const DEFAULT_CHUNK_SIZE = 1024 * 1024 // 1MB

export async function hashFile(file, { chunkSize = DEFAULT_CHUNK_SIZE, onProgress } = {}) {
  const md5 = await createMD5()
  const sha1 = await createSHA1()
  const sha256 = await createSHA256()
  const sha512 = await createSHA512()

  md5.init()
  sha1.init()
  sha256.init()
  sha512.init()

  const totalBytes = file.size ?? 0
  if (totalBytes === 0) {
    if (onProgress) onProgress(100)
    return {
      filename: file.name,
      file_type: file.type || 'application/octet-stream',
      md5: md5.digest(),
      sha1: sha1.digest(),
      sha256: sha256.digest(),
      sha512: sha512.digest()
    }
  }

  let offset = 0
  let lastPercent = -1

  while (offset < totalBytes) {
    const end = Math.min(offset + chunkSize, totalBytes)
    let slice = file.slice(offset, end)
    let buffer = await slice.arrayBuffer()
    let bytes = new Uint8Array(buffer)

    md5.update(bytes)
    sha1.update(bytes)
    sha256.update(bytes)
    sha512.update(bytes)

    offset = end

    // Drop references so the chunk buffer can be garbage-collected.
    bytes = null
    buffer = null
    slice = null

    if (onProgress) {
      const percent = Math.min(100, Math.round((offset * 100) / totalBytes))
      if (percent !== lastPercent) {
        lastPercent = percent
        onProgress(percent)
      }
    }

    if (offset < totalBytes) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  return {
    filename: file.name,
    file_type: file.type || 'application/octet-stream',
    md5: md5.digest(),
    sha1: sha1.digest(),
    sha256: sha256.digest(),
    sha512: sha512.digest()
  }
}
