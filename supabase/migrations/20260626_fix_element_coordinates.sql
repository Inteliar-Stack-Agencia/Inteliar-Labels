-- Fix canvas element coordinates that were stored in mm instead of tenths-of-mm.
-- Templates created with the AI generator before the fix have x/y values like 5, 10, 15
-- (millimeters) instead of 50, 100, 150 (tenths-of-mm as the canvas expects).
--
-- Detection heuristic: if ALL elements in a template have x <= 20 AND y <= 20,
-- they are almost certainly in mm (20 tenths-of-mm = 2mm — practically invisible on canvas).
-- We multiply every element's x and y by 10 to correct them.

update public.templates
set canvas_data = jsonb_set(
  canvas_data,
  '{elements}',
  (
    select jsonb_agg(
      elem ||
      jsonb_build_object(
        'x', (elem->>'x')::numeric * 10,
        'y', (elem->>'y')::numeric * 10
      )
    )
    from jsonb_array_elements(canvas_data->'elements') as elem
  )
)
where
  canvas_data ? 'elements'
  and jsonb_array_length(canvas_data->'elements') > 0
  and (
    -- All elements have x <= 20 AND y <= 20 → coordinates are in mm
    select bool_and(
      (elem->>'x')::numeric <= 20
      and (elem->>'y')::numeric <= 20
    )
    from jsonb_array_elements(canvas_data->'elements') as elem
  );
