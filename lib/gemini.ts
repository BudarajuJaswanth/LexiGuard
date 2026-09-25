import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Interface for the structured legal analysis output from Gemini
 */
export interface GeminiStructuredAnalysis {
  summary: string;
  keyFacts: string[];
  parties: string[];
  duration: string;
  obligations: string[];
  importantClauses: {
    title: string;
    excerpt: string;
    page?: number | string;
    significance: string;
    risk_level: 'low' | 'medium' | 'high';
  }[];
  reviewAreas: {
    title: string;
    description: string;
    reason: string;
    category: 'HIGHER ATTENTION' | 'WORTH REVIEWING' | 'INFORMATIONAL';
    source_section: string;
    page_number?: number | string | null;
    original_clause: string;
    explanation: string;
  }[];
  unclearInformation: string[];
  questionsForProfessional: string[];
  checklist: {
    id: string;
    task: string;
    target_role: string;
    completed: boolean;
  }[];
}

const SYSTEM_INSTRUCTION = `
You are an informational legal-document assistant.

Analyze only the supplied document text chunks.

Explain the document in clear, plain language.

Distinguish what the document explicitly states from general explanation.

Do not provide legal advice.

Do not determine whether any provision is legally valid or enforceable.

Do not state that a clause is illegal.

Do not create a overall legal validity score or state "This contract is risky". Focus on individual document provisions.

For reviewAreas, categorize items strictly into one of three categories:
- 'HIGHER ATTENTION' (Provisions requiring careful review like non-compete, broad indemnities, unlimited liability, automatic renewal)
- 'WORTH REVIEWING' (Standard clauses with specific scope or notice requirements like termination terms, governing law, IP assignment)
- 'INFORMATIONAL' (Standard boilerplate provisions like notices, severability, entire agreement)

For questionsForProfessional (Questions to Consider):
- Generate targeted questions based specifically on clauses found in the uploaded document text.
- Use informational phrasing such as: "Questions to consider", "May require clarification", "Consider discussing with a qualified legal professional".
- STRICTLY PROHIBIT directive imperatives such as: "You must...", "You should definitely...", "This is illegal...", "Sign this...", "Do not sign this...".

For checklist (Document Checklist):
- Generate relevant document review items based on document provisions (e.g. Verify parties, Verify dates, Review termination conditions, Review notice period, Review confidentiality, Review intellectual property, Clarify unclear provisions).

Never invent information that is absent from the supplied document.

Respond strictly in valid JSON matching the specified structure without markdown formatting or commentary.
`.trim();

/**
 * Initialize Gemini API Client securely server-side
 */
function getGeminiClient(): GoogleGenerativeAI {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY ERROR: Gemini Client must only be initialized on the server-side.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in .env.local. Please provide a valid key from Google AI Studio.');
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * Execute real GenAI Legal Document Analysis using Google Gemini
 */
export async function analyzeLegalDocumentWithGemini(
  documentName: string,
  chunksText: string
): Promise<GeminiStructuredAnalysis> {
  const genAI = getGeminiClient();

  // Active production Gemini model endpoints
  const modelNames = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];
  let lastError: Error | null = null;

  const prompt = `
[DOCUMENT NAME]: ${documentName}

[EXTRACTED DOCUMENT TEXT CHUNKS]:
${chunksText}

Perform a comprehensive legal document analysis of the document above.
Generate a JSON object strictly following this structure:

{
  "summary": "Executive plain-language summary of the agreement...",
  "keyFacts": [
    "Fact 1 regarding effective date or governing jurisdiction",
    "Fact 2 regarding confidentiality scope or payment terms"
  ],
  "parties": ["Party A Name", "Party B Name"],
  "duration": "Duration of agreement (e.g. 2 years from effective date)",
  "obligations": [
    "Explicit party obligation 1",
    "Explicit party obligation 2"
  ],
  "importantClauses": [
    {
      "title": "Title of clause (e.g. Limitation of Liability)",
      "excerpt": "Verbatim quote from document text",
      "page": "1",
      "significance": "Significance of this clause",
      "risk_level": "high"
    }
  ],
  "reviewAreas": [
    {
      "title": "Title of provision warranting attention",
      "description": "The agreement contains a specific restrictive covenant or obligation.",
      "reason": "Why it may matter (e.g. may limit post-employment options or impose unilateral liability)",
      "category": "HIGHER ATTENTION",
      "source_section": "Section 11 — Restrictive Covenants",
      "page_number": "3",
      "original_clause": "Verbatim text quote of the clause from the document text",
      "explanation": "Plain language explanation of what this clause means"
    }
  ],
  "unclearInformation": [
    "Any ambiguous term or omitted attachment that may warrant clarification"
  ],
  "questionsForProfessional": [
    "Can you clarify the scope of the termination notice provision?",
    "What activities are covered by the restrictive covenant in Section 11?",
    "Does the confidentiality obligation continue after termination of the agreement?"
  ],
  "checklist": [
    {
      "id": "task-1",
      "task": "Verify parties and effective dates",
      "target_role": "Operations",
      "completed": false
    },
    {
      "id": "task-2",
      "task": "Review termination conditions and notice period",
      "target_role": "Legal Counsel",
      "completed": false
    },
    {
      "id": "task-3",
      "task": "Review confidentiality and intellectual property terms",
      "target_role": "Legal Counsel",
      "completed": false
    },
    {
      "id": "task-4",
      "task": "Clarify unclear provisions with legal counsel",
      "target_role": "Legal Counsel",
      "completed": false
    }
  ]
}
`.trim();

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Clean Markdown block backticks if present
      const cleanJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed: GeminiStructuredAnalysis = JSON.parse(cleanJson);

      // Validate required keys
      if (!parsed.summary || !Array.isArray(parsed.keyFacts) || !Array.isArray(parsed.importantClauses)) {
        throw new Error('Gemini JSON output missing required keys.');
      }

      return parsed;
    } catch (err: any) {
      console.warn(`Gemini model [${modelName}] failed or unavailable: ${err.message}. Trying fallback...`);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(`Gemini API Analysis failed: ${lastError?.message || 'All Gemini model endpoints failed'}`);
}

/**
 * Generate 768-dimensional vector embedding for text using Gemini embedding models
 */
export async function generateGeminiEmbedding(text: string): Promise<number[]> {
  const genAI = getGeminiClient();
  const modelNames = ['gemini-embedding-001', 'gemini-embedding-2', 'gemini-embedding-2-preview'];
  let lastErr: Error | null = null;

  for (const modelName of modelNames) {
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: modelName });
      const result = await embeddingModel.embedContent(text);
      const values = result.embedding?.values;

      if (values && values.length > 0) {
        // Return 768-dim float vector for Supabase vector(768) column
        return values.slice(0, 768);
      }
    } catch (err: any) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(`Failed to generate Gemini vector embedding: ${lastErr?.message || 'Embedding endpoints unavailable'}`);
}

export interface GroundedQAResult {
  found: boolean;
  answer: string;
  sources: {
    section: string;
    page_number?: number | string;
    excerpt: string;
  }[];
}

/**
 * Perform REAL Document-Grounded Q&A using Gemini GenAI
 */
export async function generateGroundedQAAnswer(
  documentName: string,
  question: string,
  chunks: { content: string; section?: string; page_number?: number }[]
): Promise<GroundedQAResult> {
  const genAI = getGeminiClient();
  const modelNames = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];

  const contextBlock = chunks.map((c, idx) => 
    `--- [CHUNK #${idx + 1} | SECTION: ${c.section || 'General'} | PAGE: ${c.page_number || 1}] ---\n${c.content}`
  ).join('\n\n');

  const qaPrompt = `
[DOCUMENT NAME]: ${documentName}

[RETRIEVED DOCUMENT CHUNKS]:
${contextBlock}

[USER QUESTION]:
${question}

Instructions:
1. Answer the user's question using ONLY the provided document chunks above.
2. If the answer is present in the document chunks, provide a clear, plain-language answer and cite the relevant section, page number, and verbatim excerpt.
3. If the answer CANNOT be found in the provided document chunks, set "found" to false and set "answer" to EXACTLY:
"I couldn't find this information in the uploaded document."
4. Never invent clauses, page numbers, dates, obligations, or legal conclusions.

Respond strictly in valid JSON matching this structure:
{
  "found": true,
  "answer": "Clear grounded answer text...",
  "sources": [
    {
      "section": "Section Name",
      "page_number": "1",
      "excerpt": "Verbatim quote from document text supporting the answer"
    }
  ]
}
`.trim();

  let lastError: Error | null = null;
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const result = await model.generateContent(qaPrompt);
      const responseText = result.response.text().trim();
      const cleanJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed: GroundedQAResult = JSON.parse(cleanJson);

      // Enforce strict unavailability text fallback if not found
      if (!parsed.found || !parsed.answer) {
        return {
          found: false,
          answer: "I couldn't find this information in the uploaded document.",
          sources: [],
        };
      }

      return parsed;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(`Grounded Q&A Generation failed: ${lastError?.message || 'All Gemini model endpoints failed'}`);
}

export interface GeminiComparisonResult {
  summary: string;
  differences: {
    category: string;
    documentA: string;
    documentB: string;
    explanation: string;
    sourceA: string;
    sourceB: string;
  }[];
  questionsToClarify: string[];
}

/**
 * Execute REAL AI-Powered Document Comparison using Google Gemini
 */
export async function compareLegalDocumentsWithGemini(
  docAName: string,
  docAText: string,
  docBName: string,
  docBText: string
): Promise<GeminiComparisonResult> {
  const genAI = getGeminiClient();
  const modelNames = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];

  const prompt = `
[DOCUMENT A NAME]: ${docAName}
[DOCUMENT A CONTENT]:
${docAText}

---------------------------------------------------

[DOCUMENT B NAME]: ${docBName}
[DOCUMENT B CONTENT]:
${docBText}

Instructions:
Perform an objective, factual AI comparative analysis between Document A (${docAName}) and Document B (${docBName}).

IMPORTANT COMPARISON RULES:
1. Describe differences objectively and factually.
2. DO NOT rank the documents.
3. DO NOT determine which contract is better, safer, or superior.
4. NEVER say: "Document A is safer", "Document B is better", or "Document A wins".
5. Use neutral comparative phrasing, e.g. "Document A specifies 30 days, while Document B specifies 90 days."

Evaluate the following categories for differences:
- parties
- duration
- payment/compensation
- notice period
- probation
- termination
- confidentiality
- intellectual property
- non-compete/non-solicitation
- dispute resolution
- obligations
- other significant differences

Generate a strictly valid JSON response matching this schema:
{
  "summary": "High-level objective summary comparing Document A and Document B...",
  "differences": [
    {
      "category": "notice period",
      "documentA": "Requires 30 days prior written notice before termination.",
      "documentB": "Requires 90 days written notice before termination.",
      "explanation": "Document A specifies a 30-day notice period, while Document B specifies a 90-day notice period.",
      "sourceA": "Section 8 — Termination (Page 2)",
      "sourceB": "Section 12 — Termination (Page 4)"
    }
  ],
  "questionsToClarify": [
    "Targeted question 1 to ask legal counsel regarding notice period discrepancy",
    "Targeted question 2 to ask legal counsel regarding indemnification scope"
  ]
}
`.trim();

  let lastError: Error | null = null;
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const cleanJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed: GeminiComparisonResult = JSON.parse(cleanJson);
      if (!parsed.summary || !Array.isArray(parsed.differences)) {
        throw new Error('Gemini comparison JSON output missing required keys.');
      }
      return parsed;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(`Gemini Document Comparison failed: ${lastError?.message || 'All Gemini model endpoints failed'}`);
}
