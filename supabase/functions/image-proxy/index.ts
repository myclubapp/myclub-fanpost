// Edge Function: image-proxy
// Fetches remote images and returns them with proper CORS headers so the frontend can inline them.
// This helps avoid canvas tainting when exporting SVGs to PNG.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Cache-Control": "public, max-age=3600",
  };
}

serve(async (req: Request) => {
  const { method } = req;
  const origin = req.headers.get("Origin") || undefined;

  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("url");
    if (!target) {
      return new Response(JSON.stringify({ error: "Missing 'url' query param" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Validate protocol
    if (!/^https?:\/\//i.test(target)) {
      return new Response(JSON.stringify({ error: "Invalid URL protocol" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const fetched = await fetch(target);
    if (!fetched.ok) {
      return new Response(JSON.stringify({ error: `Upstream fetch failed: ${fetched.status}` }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Pass-through the content with CORS headers
    const contentType = fetched.headers.get("Content-Type") || "application/octet-stream";
    const body = await fetched.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": contentType, ...corsHeaders(origin) },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});
