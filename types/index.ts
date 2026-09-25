export type DocumentStatus = 
  | 'uploaded'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'ready'
  | 'analyzing'
  | 'completed'
  | 'failed';

export interface LegalDocument {
  id: string;
  user_id?: string;
  name: string;
  file_path?: string;
  file_url?: string;
  file_size: number;
  file_type: string;
  status: DocumentStatus;
  error_message?: string | null;
  created_at: string;
  updated_at?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';
export type SeverityLevel = 'info' | 'warning' | 'critical';

export interface ImportantClause {
  title: string;
  excerpt: string;
  page?: number | string;
  significance: string;
  risk_level: RiskLevel;
}

export interface ReviewRadarItem {
  category: string;
  description: string;
  impact: string;
  severity: SeverityLevel;
}

export interface ActionChecklistItem {
  id: string;
  task: string;
  target_role: string;
  completed: boolean;
}

export interface AnalysisData {
  id: string;
  document_id: string;
  summary: string;
  key_facts: string[];
  obligations: string[];
  important_clauses: ImportantClause[];
  review_radar: ReviewRadarItem[];
  questions_to_consider: string[];
  action_checklist: ActionChecklistItem[];
  created_at: string;
}

export interface DifferenceItem {
  topic: string;
  doc_a_clause: string;
  doc_b_clause: string;
  impact: string;
}

export interface ComparisonData {
  id: string;
  doc_a_id: string;
  doc_b_id: string;
  summary: string;
  differences: DifferenceItem[];
  questions_to_clarify: string[];
  created_at: string;
}

export interface Citation {
  clause: string;
  text: string;
  page?: number | string;
}

export interface QAMessage {
  id: string;
  document_id: string;
  question: string;
  answer: string | null;
  citations?: Citation[];
  status: 'pending' | 'completed' | 'error';
  created_at: string;
}
