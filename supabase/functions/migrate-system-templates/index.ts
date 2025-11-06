import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch all system templates
    const { data: templates, error: fetchError } = await supabaseClient
      .from('templates')
      .select('id, name, svg_config')
      .eq('is_system', true)

    if (fetchError) throw fetchError

    if (!templates) {
      return new Response(
        JSON.stringify({ message: 'No templates found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    let updatedCount = 0

    // Process each template
    for (const template of templates) {
      const svgConfig = template.svg_config
      if (!svgConfig || !svgConfig.elements) continue

      let modified = false
      const changes: string[] = []

      // Update elements with suffix-based apiFields to prefix-based AND fix Bebas Neue font-weight
      const updatedElements = svgConfig.elements.map((element: any) => {
        let elementModified = false
        const updatedElement = { ...element }

        // 1. Convert suffix notation (teamHome2, teamHomeLogo3) to prefix notation (game-2.teamHome, game-3.teamHomeLogo)
        if (element.apiField) {
          const apiField = element.apiField
          const suffixMatch = apiField.match(/^(.+?)(\d)$/)
          
          if (suffixMatch) {
            const [, fieldName, gameNumber] = suffixMatch
            const newApiField = `game-${gameNumber}.${fieldName}`
            
            console.log(`[${template.name}] Converting apiField: ${apiField} -> ${newApiField}`)
            changes.push(`apiField: ${apiField} -> ${newApiField}`)
            updatedElement.apiField = newApiField
            elementModified = true
          }
        }

        // 2. Fix Bebas Neue font-weight (must be 400, not 700 or 900)
        if (updatedElement.fontFamily && 
            updatedElement.fontFamily.toLowerCase().includes('bebas neue') &&
            updatedElement.fontWeight) {
          
          // Normalize fontWeight to string for comparison
          const currentWeight = String(updatedElement.fontWeight)
          
          if (currentWeight !== '400') {
            const oldWeight = updatedElement.fontWeight
            updatedElement.fontWeight = '400'
            
            console.log(`[${template.name}] Fixing fontWeight for element "${updatedElement.id}": ${oldWeight} -> 400`)
            changes.push(`fontWeight (${updatedElement.id}): ${oldWeight} -> 400`)
            elementModified = true
          }
        }

        if (elementModified) {
          modified = true
        }

        return updatedElement
      })

      if (modified) {
        // Update template in database
        const { error: updateError } = await supabaseClient
          .from('templates')
          .update({
            svg_config: {
              ...svgConfig,
              elements: updatedElements
            }
          })
          .eq('id', template.id)

        if (updateError) {
          console.error(`Error updating template ${template.name}:`, updateError)
          continue
        }

        updatedCount++
        console.log(`Updated template: ${template.name}`, changes)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully updated ${updatedCount} system templates`,
        totalProcessed: templates.length,
        updatedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
