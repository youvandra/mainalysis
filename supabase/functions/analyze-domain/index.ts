import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { domainName, price, accountId, source } = await req.json();
    if (!domainName || !accountId) {
      return new Response(JSON.stringify({
        error: "Missing required fields"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Determine credit cost based on source
    let creditCost = 3; // Default for new_analysis and fractionalize
    let sourceDescription = 'New Analysis';

    if (source === 'search_listed') {
      creditCost = 1;
      sourceDescription = 'Search Listed Domain';
    } else if (source === 'fractionalize') {
      creditCost = 3;
      sourceDescription = 'Fractionalize Domain';
    }

    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase.from("analyzed_domains").select("*").eq("account_id", accountId).eq("domain_name", domainName).maybeSingle();
    if (existingAnalysis) {
      // For cached analysis, DO NOT charge credits - it's free!
      return new Response(JSON.stringify({
        success: true,
        cached: true,
        data: existingAnalysis.analysis_data
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Call Groq API for AI analysis
    const groqApiKey = "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";
    const needsPriceEstimate = !price || price;
    const priceContext = needsPriceEstimate ? "Please estimate a fair market price for this domain in ETH based on its characteristics." : `Please estimate a fair market price for this domain in ETH based on its characteristics.`;
    const prompt = `You are an expert domain valuation specialist with deep knowledge of domain markets, brand value, and web traffic patterns.

Analyze the domain "${domainName}" ${priceContext}.

IMPORTANT CONTEXT:
- Consider if this domain is associated with a well-known brand, company, or service (e.g., google, amazon, microsoft, openai, etc.)
- For established brands: estimate MUCH HIGHER prices (10-1000+ ETH) and very high traffic (millions of visits)
- For generic premium keywords (e.g., ai, tech, shop, app): estimate high prices (1-50 ETH) and significant traffic
- For new/unknown domains: use standard market pricing based on characteristics

Provide a detailed analysis in JSON format with the following structure:

{
  "valueHistory": [6 months of historical value data with months (Mar, Apr, May, Jun, Jul, Aug). Show DYNAMIC changes - not linear growth. For established brands use millions with 5-15% fluctuations. For premium domains use hundreds of thousands with realistic market volatility (up 20%, down 10%, up 15%, etc.). For standard domains show natural price discovery with ups and downs.],
  "trafficData": [6 months of estimated traffic data with months and visit counts. Show REALISTIC GROWTH with ups and downs - not linear. For major brands use MILLIONS (e.g., 150M-200M monthly with 10-20M variations). For popular domains use hundreds of thousands with 20-40% month-to-month variation. For new/small domains (1K-50K) show volatile growth like 1.2K, 3.5K, 2.8K, 5.1K, 4.3K, 7.2K - mix growth spurts with dips.],
  "seoMetrics": [
    {"label": "Domain Authority", "score": 0-100, "max": 100},
    {"label": "Page Authority", "score": 0-100, "max": 100},
    {"label": "Trust Score", "score": 0-100, "max": 100},
    {"label": "Spam Score", "score": 0-100, "max": 100, "inverse": true}
  ],
  "keywordData": [
    {"keyword": "5-10 exact or similar keyword phrase", "volume": monthly search volume as number (estimate 1000-50000+ for popular keywords, 100-1000 for niche), "difficulty": 0-100}
  ],
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
  "marketScore": 1-10 rating (well-known brands should score 9-10, premium keywords 7-9, good domains 5-7, standard 3-5, poor 1-3),
  "estimatedGrowth": "+XX%" string,
  "searchVolume": string for monthly searches (use K for thousands, M for millions - e.g., "1.2M" for 1.2 million searches/month for popular brands),
  "domainAge": number of years,
  "registrationYear": year like 2015,
  "summary": "2-3 sentence summary about the domain's value proposition. For well-known brands, mention the brand recognition and market position. For new domains, focus on potential.",
  "estimatedPrice": estimated fair market value in ETH (only if price estimation is needed, otherwise omit this field)
}

CRITICAL VALUATION FACTORS:

1. BRAND RECOGNITION:
   - Established major brands (Google, Amazon, Microsoft, Apple, Meta, etc.): 100-10,000+ ETH
   - Well-known tech companies or services (OpenAI, GitHub, Stripe, etc.): 50-500 ETH
   - Popular generic tech keywords (AI, Cloud, Crypto, Tech, App, etc.): 10-100 ETH
   - Brandable but unknown domains: Use length/quality based pricing below

2. DOMAIN CHARACTERISTICS:
   - Ultra-premium (1-2 chars, major brand): 1000-10000 ETH
   - Super premium (3-4 chars, high-value keyword .com/.ai): 100-500 ETH
   - Premium short (5-6 chars, good keyword, .io): 20-100 ETH
   - Good brandable (6-8 chars, memorable): 1-20 ETH
   - Standard domains (9+ chars or non-premium TLD): 0.19-5 ETH
   - Low value (hyphens, numbers, long, poor TLD): 0.015-0.15 ETH

3. TLD VALUE MULTIPLIERS:
   - .com: 1.5x-3x (highest value, universal appeal)
   - .ai, .xyz, .ape, .shib: 2x-5x for AI-related brands (extremely hot in 2024-2025)
   - .io: 1.5x-2x for tech companies
   - .app, .tech: 0.7x-1.2x
   - Others: 0.3x-0.8x

4. TRAFFIC ESTIMATION:
   - Global mega-brands (Google, Facebook, Amazon): 100M-500M+ monthly visits
   - Major tech platforms (GitHub, OpenAI, Stripe): 10M-100M monthly visits
   - Popular services/tools: 500K-10M monthly visits
   - Niche established sites: 50K-500K monthly visits
   - New/unknown domains: 0-50K monthly visits

5. SEO METRICS:
   - Major brands: Domain Authority 90-100, very high trust scores
   - Established sites: Domain Authority 60-89
   - New domains: Domain Authority 0-30

CRITICAL INSTRUCTION: You MUST provide "estimatedPrice" in ETH.
- Think carefully: Is this a well-known brand? Price accordingly (10-10000+ ETH)
- Is this a premium generic keyword? Price high (1-100 ETH)
- Is this a new/unknown domain? Use characteristic-based pricing (0.005-5 ETH)
- ALWAYS consider real-world domain sales and current market conditions
- The .ai TLD is EXTREMELY valuable in 2024-2025 for AI-related domains
Return ONLY valid JSON, no additional text.`;
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a domain valuation expert. Always respond with valid JSON only, no markdown, no explanations, just the JSON object."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: {
          type: "json_object"
        }
      })
    });
    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.statusText}`);
    }
    const groqData = await groqResponse.json();
    const analysisText = groqData.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error("No analysis returned from Groq API");
    }
    // Parse the JSON response from Groq
    let analysisData;
    try {
      let jsonText = analysisText.trim();
      // Remove markdown code blocks
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      // Extract JSON object - find the first { and last }
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }
      analysisData = JSON.parse(jsonText);
      // Validate required fields
      if (!analysisData.valueHistory || !analysisData.trafficData || !analysisData.seoMetrics) {
        throw new Error("Missing required fields in AI response");
      }
      // Ensure searchVolume has a valid value
      if (!analysisData.searchVolume || analysisData.searchVolume === "0" || analysisData.searchVolume === "0/mo") {
        analysisData.searchVolume = "5K";
      }
      // Ensure all keywords have valid search volumes
      if (analysisData.keywordData && Array.isArray(analysisData.keywordData)) {
        analysisData.keywordData = analysisData.keywordData.map((kw)=>({
            ...kw,
            volume: !kw.volume || kw.volume === 0 ? 1000 : kw.volume
          }));
      }
    } catch (parseError) {
      console.error("Failed to parse Groq response:", analysisText);
      console.error("Parse error:", parseError);
      throw new Error(`Failed to parse AI analysis response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    // Use estimated price if available, otherwise use provided price
    const finalPrice = analysisData.estimatedPrice ? Math.floor(analysisData.estimatedPrice * 1e18) : price;

    // Charge credits for the new analysis
    const { error: creditError } = await supabase.rpc('use_credits', {
      p_account_id: accountId,
      p_amount: creditCost,
      p_description: `${sourceDescription} - ${domainName}`,
      p_metadata: {
        domain_name: domainName,
        source: source || 'new_analysis',
        credits_used: creditCost,
        cached: false
      }
    });

    if (creditError) {
      return new Response(JSON.stringify({
        error: creditError.message || 'Insufficient credits'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Store the analysis in the database using upsert
    const { error: saveError } = await supabase.from("analyzed_domains").upsert({
      account_id: accountId,
      domain_name: domainName,
      price: finalPrice.toString(),
      analysis_data: analysisData
    }, {
      onConflict: "account_id,domain_name"
    });
    if (saveError) {
      console.error("Error saving analysis:", saveError);
      throw new Error(`Failed to save analysis: ${saveError.message}`);
    }
    return new Response(JSON.stringify({
      success: true,
      cached: false,
      data: analysisData
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error in analyze-domain function:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
