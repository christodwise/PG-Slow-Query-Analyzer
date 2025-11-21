import { GoogleGenAI } from "@google/genai";
import { QueryStat } from "../types";

const getAiClient = () => {
  // First check localStorage (user settings)
  const localKey = localStorage.getItem('gemini_api_key');
  if (localKey) return new GoogleGenAI({ apiKey: localKey });

  // Fallback to env var
  const envKey = process.env.API_KEY;
  if (envKey) return new GoogleGenAI({ apiKey: envKey });

  return null;
};

export const analyzeQuery = async (queryStat: QueryStat): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    return "Error: API Key not found. Please ensure process.env.API_KEY is set.";
  }

  const prompt = `
    You are a Senior PostgreSQL Database Administrator. 
    Analyze the following slow query performance statistics and provide specific optimization advice.

    **Query Details:**
    - SQL: \`${queryStat.query}\`
    - Average Execution Time: ${queryStat.mean_time.toFixed(2)} ms
    - Total Calls: ${queryStat.calls}
    - Total Rows Returned: ${queryStat.rows}
    - Disk Reads (Shared Blks Read): ${queryStat.shared_blks_read}
    - Cache Hits (Shared Blks Hit): ${queryStat.shared_blks_hit}

    **Instructions:**
    1. Identify why this query might be performing poorly based on the metrics (e.g., high disk reads implies missing index or cold cache).
    2. Suggest specific PostgreSQL indexes (CREATE INDEX ...).
    3. Suggest query rewrites if applicable.
    4. Keep the response concise, using Markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to analyze query due to an API error.";
  }
};