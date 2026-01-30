import Database from 'better-sqlite3'
import { resolve } from 'path'
import type { Conversation, Message, SearchHit, Stats } from '~~/shared/types'

const DB_PATH = resolve(process.cwd(), 'bandofy_export_studio.sqlite3')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true })
    _db.pragma('journal_mode = WAL')
  }
  return _db
}

export function listConversations(limit = 50, offset = 0, search = ''): Conversation[] {
  const db = getDb()
  if (search.trim()) {
    const like = `%${search.trim()}%`
    return db.prepare(`
      SELECT id, title, created_at, updated_at, message_count
      FROM conversations
      WHERE title LIKE ?
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `).all(like, limit, offset) as Conversation[]
  }
  return db.prepare(`
    SELECT id, title, created_at, updated_at, message_count
    FROM conversations
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as Conversation[]
}

export function getConversation(id: string): Conversation | undefined {
  const db = getDb()
  return db.prepare(`
    SELECT id, title, created_at, updated_at, message_count
    FROM conversations
    WHERE id = ?
  `).get(id) as Conversation | undefined
}

export function getMessages(conversationId: string): Message[] {
  const db = getDb()
  return db.prepare(`
    SELECT id, role, content_text, created_at, turn_index
    FROM messages
    WHERE conversation_id = ?
    ORDER BY turn_index ASC
  `).all(conversationId) as Message[]
}

export function searchMessages(query: string, limit = 50): SearchHit[] {
  const q = query.trim()
  if (!q) return []
  const db = getDb()
  const safe = q.replace(/"/g, '""')
  try {
    return db.prepare(`
      SELECT m.id, m.conversation_id, m.role, m.content_text, m.created_at,
             bm25(messages_fts) AS rank
      FROM messages_fts
      JOIN messages m ON messages_fts.rowid = m.rowid
      WHERE messages_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `).all(safe, limit) as SearchHit[]
  } catch {
    const like = `%${q}%`
    return db.prepare(`
      SELECT id, conversation_id, role, content_text, created_at, 0.0 AS rank
      FROM messages
      WHERE content_text LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(like, limit) as SearchHit[]
  }
}

export function getStats(): Stats {
  const db = getDb()
  const convs = (db.prepare('SELECT COUNT(*) AS n FROM conversations').get() as { n: number }).n
  const msgs = (db.prepare('SELECT COUNT(*) AS n FROM messages').get() as { n: number }).n
  const chunks = (db.prepare('SELECT COUNT(*) AS n FROM chunks').get() as { n: number }).n
  return { conversations: convs, messages: msgs, chunks: chunks }
}

export function exportConversationMarkdown(conversationId: string): string {
  const db = getDb()
  const conv = db.prepare('SELECT title FROM conversations WHERE id = ?').get(conversationId) as { title: string } | undefined
  const title = conv?.title ?? 'Untitled'
  const msgs = getMessages(conversationId)
  const lines = [`# ${title}`, '']
  for (const m of msgs) {
    const role = (m.role || 'unknown').trim().toLowerCase()
    lines.push(`## ${role}`, '', m.content_text || '', '')
  }
  return lines.join('\n').trim() + '\n'
}
