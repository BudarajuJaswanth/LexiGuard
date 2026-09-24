export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DocumentStatus = 'uploaded' | 'processing' | 'analyzed' | 'error';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          file_url: string;
          file_type: string;
          file_size: number;
          status: DocumentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          file_url: string;
          file_type: string;
          file_size: number;
          status?: DocumentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          file_url?: string;
          file_type?: string;
          file_size?: number;
          status?: DocumentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          page_number: number | null;
          section: string | null;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          content: string;
          chunk_index: number;
          page_number?: number | null;
          section?: string | null;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          content?: string;
          chunk_index?: number;
          page_number?: number | null;
          section?: string | null;
          embedding?: number[] | null;
          created_at?: string;
        };
      };
      analyses: {
        Row: {
          id: string;
          document_id: string;
          summary: string;
          key_facts: Json;
          parties: Json;
          duration: string | null;
          obligations: Json;
          important_clauses: Json;
          review_areas: Json;
          unclear_information: Json;
          questions: Json;
          checklist: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          summary: string;
          key_facts?: Json;
          parties?: Json;
          duration?: string | null;
          obligations?: Json;
          important_clauses?: Json;
          review_areas?: Json;
          unclear_information?: Json;
          questions?: Json;
          checklist?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          summary?: string;
          key_facts?: Json;
          parties?: Json;
          duration?: string | null;
          obligations?: Json;
          important_clauses?: Json;
          review_areas?: Json;
          unclear_information?: Json;
          questions?: Json;
          checklist?: Json;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          sources: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          sources?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          role?: MessageRole;
          content?: string;
          sources?: Json | null;
          created_at?: string;
        };
      };
      comparisons: {
        Row: {
          id: string;
          user_id: string;
          document_a_id: string;
          document_b_id: string;
          summary: string;
          differences: Json;
          questions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_a_id: string;
          document_b_id: string;
          summary: string;
          differences?: Json;
          questions?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_a_id?: string;
          document_b_id?: string;
          summary?: string;
          differences?: Json;
          questions?: Json;
          created_at?: string;
        };
      };
    };
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[];
          match_count: number;
          filter_document_id?: string;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          page_number: number | null;
          section: string | null;
          similarity: number;
        }[];
      };
    };
  };
}
