import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all result templates
    const { data: templates, error: fetchError } = await supabaseClient
      .from('templates')
      .select('id, name, svg_config')
      .eq('is_system', true)
      .ilike('name', '%result%');

    if (fetchError) {
      throw fetchError;
    }

    const updates = [];

    for (const template of templates || []) {
      const svgConfig = template.svg_config;
      
      // Filter out resultDetail elements
      const filteredElements = svgConfig.elements.filter(
        (elem: any) => !elem.id?.includes('result-detail')
      );

      // Update the svg_config
      const { error: updateError } = await supabaseClient
        .from('templates')
        .update({
          svg_config: {
            ...svgConfig,
            elements: filteredElements
          }
        })
        .eq('id', template.id);

      if (updateError) {
        console.error(`Error updating template ${template.name}:`, updateError);
      } else {
        updates.push(template.name);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updates.length} templates`,
        templates: updates
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
