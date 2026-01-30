import { execFile } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import { join } from 'path'
import { readFile, unlink } from 'fs/promises'

const execFileAsync = promisify(execFile)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const redact = body?.redact === true
  const outPath = join(tmpdir(), `export_messages_${Date.now()}.jsonl`)
  const args = ['-m', 'bandofy_export_studio', 'export-messages-jsonl', '--out', outPath]
  if (redact) args.push('--redact')

  try {
    await execFileAsync('python3', args, { cwd: process.cwd(), timeout: 120_000 })
    const data = await readFile(outPath, 'utf-8')
    setHeader(event, 'Content-Type', 'application/x-ndjson')
    setHeader(event, 'Content-Disposition', 'attachment; filename="messages.jsonl"')
    return data
  } finally {
    unlink(outPath).catch(() => {})
  }
})
