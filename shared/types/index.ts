export interface Conversation {
  id: string
  title: string
  created_at: number
  updated_at: number
  message_count: number
}

export interface Message {
  id: string
  conversation_id?: string
  role: string
  content_text: string
  created_at: number
  turn_index: number
}

export interface SearchHit {
  id: string
  conversation_id: string
  role: string
  content_text: string
  created_at: number
  rank: number
}

export interface Stats {
  conversations: number
  messages: number
  chunks: number
}
