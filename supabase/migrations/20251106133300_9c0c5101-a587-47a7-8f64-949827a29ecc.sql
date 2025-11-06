-- Update Game Result - 1 Spiel template
-- Remove resultDetail element and ensure result is italic
UPDATE templates 
SET svg_config = jsonb_set(
  svg_config,
  '{elements}',
  (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(svg_config->'elements') elem
    WHERE elem->>'id' NOT LIKE '%result-detail%'
  )
)
WHERE is_system = true 
AND name = 'Game Result - 1 Spiel';

-- Update Game Result - 2 Spiele template
-- Remove resultDetail elements and ensure results are italic
UPDATE templates 
SET svg_config = jsonb_set(
  svg_config,
  '{elements}',
  (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(svg_config->'elements') elem
    WHERE elem->>'id' NOT LIKE '%result-detail%'
  )
)
WHERE is_system = true 
AND name = 'Game Result - 2 Spiele';

-- Update Game Result - 3 Spiele template
-- Remove resultDetail elements and ensure results are italic
UPDATE templates 
SET svg_config = jsonb_set(
  svg_config,
  '{elements}',
  (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(svg_config->'elements') elem
    WHERE elem->>'id' NOT LIKE '%result-detail%'
  )
)
WHERE is_system = true 
AND name = 'Game Result - 3 Spiele';