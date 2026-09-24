# LexiGuard — AI Legal Document Navigator 🛡️

**LexiGuard** is a production-quality GenAI web application built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Google Gemini**, and **Supabase Backend (PostgreSQL + pgvector + Storage)**.

Designed with strict legal safety boundaries and document-grounded AI navigation, LexiGuard assists users in analyzing agreements, extracting clauses, asking grounded Q&A, and comparing documents side-by-side.

---

## 🔑 Key Features

1. **AI Document Analysis**: Plain-language summaries, key facts, party obligations, and structured clause extraction.
2. **Review Radar**: Highlights potential areas requiring attorney review and non-standard risk provisions.
3. **Document Q&A**: Grounded question-answering with exact source citations and page/chunk references.
4. **Two-Document Comparison**: Side-by-side analysis of Document A vs Document B highlighting clause variations.
5. **Actionable Checklist**: Post-execution compliance tasks categorized by target role.
6. **Supabase Backend & Vector Search**: `pgvector` HNSW index for high-speed similarity search over legal text embeddings.
7. **Legal Safety Boundaries**: System prompts strictly enforce **NOT an AI lawyer** disclaimers and prohibit claims of legal validity or enforceability.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Storage, `pgvector`)
- **AI Engine**: Google Gemini (`gemini-3.6-flash`, `text-embedding-004`)

---

## 🚦 Getting Started

### 1. Clone the repository & Install Dependencies

```bash
git clone https://github.com/BudarajuJaswanth/lexiguard.git
cd lexiguard
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```env
# PUBLIC CLIENT VARIABLES
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# SERVER-ONLY SECRETS
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run Database Migrations

Apply the migration script under [`supabase/migrations/20260924000000_init_lexiguard.sql`](./supabase/migrations/20260924000000_init_lexiguard.sql) in your Supabase SQL Editor to initialize tables, `pgvector`, RLS policies, and the `documents` storage bucket.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view LexiGuard.

---

## ⚠️ Legal Notice

> **LexiGuard provides general informational assistance and document navigation. It does not provide legal advice or determine whether a provision is legally valid.** Consider discussing identified provisions with a qualified legal professional.
