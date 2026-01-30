import { execFile } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import { join } from 'path'
import { readdir, readFile, rm } from 'fs/promises'
import { createWriteStream } from 'fs'
import { Writable } from 'stream'
import { createGzip } from 'zlib'
import { pipeline } from 'stream/promises'
import { pack } from 'tar-stream'

const execFileAsync = promisify(execFile)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const redact = body?.redact === true
  const outDir = join(tmpdir(), `obsidian_vault_${Date.now()}`)
  const args = ['-m', 'bandofy_export_studio', 'export-obsidian', '--out-dir', outDir]
  if (redact) args.push('--redact')

  try {
    await execFileAsync('python3', args, { cwd: process.cwd(), timeout: 300_000 })
    const files = await readdir(outDir)

    // Stream as tar.gz
    const tarPath = join(tmpdir(), `obsidian_vault_${Date.now()}.tar.gz`)
    const p = pack()
    const gzip = createGzip()
    const output = createWriteStream(tarPath)

    const pipelinePromise = pipeline(p, gzip, output)

    for (const file of files) {
      const content = await readFile(join(outDir, file))
      p.entry({ name: file }, content)
    }
    p.finalize()
    await pipelinePromise

    const tarData = await readFile(tarPath)
    setHeader(event, 'Content-Type', 'application/gzip')
    setHeader(event, 'Content-Disposition', 'attachment; filename="obsidian_vault.tar.gz"')
    return tarData
  } finally {
    rm(outDir, { recursive: true, force: true }).catch(() => {})
  }
})
