export interface Conversation {
  id: string
  title: string
  created_at: number
  updated_at: number
  message_count: number
  default_model_slug?: string | null
  gizmo_id?: string | null
  project_display_name?: string | null
  project_gizmo_type?: string | null
}

export interface Project {
  gizmo_id: string
  gizmo_type: string
  display_name: string
  conversation_count: number
}

export interface Message {
  id: string
  conversation_id?: string
  role: string
  content_type: string
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
  projects: number
}

// --- Fabric AI Jobs ---

export interface JobProgress {
  current: number
  total: number
  message: string
}

export interface Job {
  id: string
  type: 'conversation' | 'project'
  target_id: string
  target_name: string
  pattern: string
  status: 'pending' | 'running' | 'done' | 'failed'
  progress: JobProgress | null
  result_path: string | null
  error: string | null
  created_at: number
  started_at: number | null
  finished_at: number | null
}

export interface PatternInfo {
  id: string
  label: string
  description: string
}

export const CONVERSATION_PATTERNS: PatternInfo[] = [
  { id: 'extract_wisdom', label: 'Extract Wisdom', description: 'Summary, ideas, insights, quotes, habits, facts, recommendations' },
  { id: 'summarize', label: 'Summarize', description: 'Structured summary with key points and takeaways' },
  { id: 'analyze_debate', label: 'Analyze Debate', description: 'Conversational flow: arguments, agreements, disagreements' },
  { id: 'rate_content', label: 'Rate Content', description: 'Quality rating: labels, tier (S/A/B/C/D), score /100' },
  { id: 'create_report_finding', label: 'Report', description: 'Formal report: description, risks, recommendations, trends' },
]

export const PROJECT_PATTERNS: PatternInfo[] = [
  { id: 'summarize', label: 'Summarize', description: 'Project summary from all conversations' },
  { id: 'extract_wisdom', label: 'Extract Wisdom', description: 'Global wisdom extraction from the project' },
  { id: 'analyze_paper', label: 'Analyze Paper', description: 'Detailed academic analysis of the project' },
]
