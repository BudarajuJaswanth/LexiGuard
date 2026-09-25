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

When identifying potential concerns, use neutral, factual language such as:
- 'may require closer review'
- 'may warrant clarification'
- 'consider discussing this with a qualified legal professional.'

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
    "Targeted question 1 to ask legal counsel regarding liabilities",
    "Targeted question 2 to ask legal counsel regarding termination notice"
  ],
  "checklist": [
    {
      "id": "task-1",
      "task": "Compliance task to fulfill post-execution",
      "target_role": "Legal Counsel / Operations",
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
