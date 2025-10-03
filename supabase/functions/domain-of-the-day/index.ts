import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DomainOfTheDayPayload {
  domain_name: string;
  description?: string;
  valuation?: number;
  market_score?: number;
  seo_value?: string;
  growth_potential?: string;
  tags?: string[];
  featured_date: string; // Format: YYYY-MM-DD
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization token from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = userData.user.id;

    if (req.method === "GET") {
      // Get domain of the day
      const url = new URL(req.url);
      const date = url.searchParams.get("date"); // Optional: specific date, otherwise gets today

      let query = supabase
        .from("domain_of_the_day")
        .select("*")
        .order("featured_date", { ascending: false });

      if (date) {
        query = query.eq("featured_date", date);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      // Create new domain of the day
      const payload: DomainOfTheDayPayload = await req.json();

      if (!payload.domain_name || !payload.featured_date) {
        return new Response(
          JSON.stringify({ error: "domain_name and featured_date are required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data, error } = await supabase
        .from("domain_of_the_day")
        .insert({
          domain_name: payload.domain_name,
          description: payload.description || "",
          valuation: payload.valuation || 0,
          market_score: payload.market_score || 0,
          seo_value: payload.seo_value || "",
          growth_potential: payload.growth_potential || "",
          tags: payload.tags || [],
          featured_date: payload.featured_date,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ data }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "PUT") {
      // Update domain of the day
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(
          JSON.stringify({ error: "ID parameter required for updates" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const payload: Partial<DomainOfTheDayPayload> = await req.json();

      const { data, error } = await supabase
        .from("domain_of_the_day")
        .update({
          ...(payload.domain_name && { domain_name: payload.domain_name }),
          ...(payload.description !== undefined && { description: payload.description }),
          ...(payload.valuation !== undefined && { valuation: payload.valuation }),
          ...(payload.market_score !== undefined && { market_score: payload.market_score }),
          ...(payload.seo_value !== undefined && { seo_value: payload.seo_value }),
          ...(payload.growth_potential !== undefined && { growth_potential: payload.growth_potential }),
          ...(payload.tags && { tags: payload.tags }),
          ...(payload.featured_date && { featured_date: payload.featured_date }),
        })
        .eq("id", id)
        .eq("created_by", userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      // Delete domain of the day
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(
          JSON.stringify({ error: "ID parameter required for deletion" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error } = await supabase
        .from("domain_of_the_day")
        .delete()
        .eq("id", id)
        .eq("created_by", userId);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ message: "Domain of the day deleted successfully" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
