import { supabase } from '../lib/supabase';

interface AnalysisData {
  valueHistory: Array<{ month: string; value: number }>;
  trafficData: Array<{ month: string; visits: number }>;
  seoMetrics: Array<{ label: string; score: number; max: number; inverse?: boolean }>;
  keywordData: Array<{ keyword: string; volume: number; difficulty: number }>;
  features: Array<{ label: string; available: boolean }>;
  marketScore: number;
  estimatedGrowth: string;
  searchVolume: string;
  domainAge: number;
  registrationYear: number;
  summary: string;
}

interface AnalysisResponse {
  success: boolean;
  cached: boolean;
  data: AnalysisData;
}

async function callGroqAPI(domainName: string, price: number): Promise<AnalysisData> {
  const groqApiKey = "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";

  const prompt = `Analyze the domain "${domainName}" with a price of ${(price / 1e18).toFixed(4)} ETH. Provide a detailed analysis in JSON format with the following structure:

{
  "valueHistory": [6 months of historical value data with months (Mar, Apr, May, Jun, Jul, Aug) and values starting from 60% of current price and growing to current price],
  "trafficData": [6 months of estimated traffic data with months and visit counts growing realistically],
  "seoMetrics": [
    {"label": "Domain Authority", "score": 0-100, "max": 100},
    {"label": "Page Authority", "score": 0-100, "max": 100},
    {"label": "Trust Score", "score": 0-100, "max": 100},
    {"label": "Spam Score", "score": 0-100, "max": 100, "inverse": true}
  ],
  "keywordData": [4-5 relevant keywords with search volume and difficulty 0-100],
  "features": [
    {"label": "Short & Memorable", "available": boolean},
    {"label": "Easy to Spell", "available": boolean},
    {"label": "Brandable", "available": boolean},
    {"label": "SEO Friendly", "available": boolean},
    {"label": "No Hyphens", "available": boolean},
    {"label": "No Numbers", "available": boolean},
    {"label": "Premium TLD", "available": boolean},
    {"label": "Social Media Available", "available": boolean}
  ],
  "marketScore": 1-10 rating,
  "estimatedGrowth": "+XX%" string,
  "searchVolume": "XX.XK" string for monthly searches,
  "domainAge": number of years,
  "registrationYear": year like 2015,
  "summary": "2-3 sentence summary about the domain's value proposition"
}

Make realistic estimates based on:
- Domain length and memorability
- TLD quality (.com, .io, .ai are premium)
- Keyword relevance
- Price point
- Presence of hyphens or numbers

Return ONLY valid JSON, no additional text.`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const groqData = await response.json();
  const analysisText = groqData.choices[0]?.message?.content;

  if (!analysisText) {
    throw new Error("No analysis returned from Groq API");
  }

  const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  } else {
    return JSON.parse(analysisText);
  }
}

export async function analyzeDomain(
  domainName: string,
  price: number,
  accountId: string,
  source: 'search_listed' | 'fractionalize' | 'new_analysis' = 'new_analysis'
): Promise<AnalysisResponse> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Check if analysis already exists
  const { data: existingAnalysis } = await supabase
    .from("analyzed_domains")
    .select("*")
    .eq("account_id", accountId)
    .eq("domain_name", domainName)
    .maybeSingle();

  if (existingAnalysis) {
    return {
      success: true,
      cached: true,
      data: existingAnalysis.analysis_data,
      price: existingAnalysis.price,
    };
  }


  // Call the edge function to analyze the domain
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const apiUrl = `${supabaseUrl}/functions/v1/analyze-domain`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      domainName,
      price,
      accountId,
      source,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to analyze domain');
  }

  const result = await response.json();
  const { data: savedAnalysis } = await supabase
    .from("analyzed_domains")
    .select("*")
    .eq("account_id", accountId)
    .eq("domain_name", domainName)
    .maybeSingle();

  console.log('Saved analysis from DB:', savedAnalysis);
  console.log('Price from DB:', savedAnalysis?.price);

  return {
    success: result.success,
    cached: result.cached,
    data: result.data,
    price: savedAnalysis?.price || price.toString(),
  };
}
