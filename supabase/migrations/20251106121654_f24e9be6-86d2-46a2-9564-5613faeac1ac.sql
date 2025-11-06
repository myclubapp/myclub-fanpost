-- Add support for system templates that are available to all users
-- Make user_id nullable and add is_system flag
ALTER TABLE public.templates
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Update RLS policies to include system templates
DROP POLICY IF EXISTS "Paid users can view their own templates" ON public.templates;
CREATE POLICY "Users can view their own templates and system templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING (
    is_system = true OR
    (auth.uid() = user_id AND public.has_role(auth.uid(), 'paid_user'))
  );

-- Insert Game Preview System Templates
-- 1. Home Game - 1 Spiel
INSERT INTO public.templates (name, supported_games, svg_config, is_system, user_id)
VALUES (
  'Home Game - 1 Spiel',
  1,
  '{
    "format": "4:5",
    "elements": [
      {
        "x": 540,
        "y": 190,
        "id": "text-homegame-title",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 1,
        "content": "HOME GAME",
        "fontSize": 216,
        "fontStyle": "normal",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 1
      },
      {
        "x": 540,
        "y": 243,
        "id": "api-text-datetime",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 2,
        "content": "{date} {time} {location}",
        "apiField": "date,time,location",
        "fontSize": 49,
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "700",
        "textAnchor": "middle"
      },
      {
        "x": 27,
        "y": 1150,
        "id": "api-image-home-logo",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 3,
        "apiField": "teamHomeLogo"
      },
      {
        "x": 243,
        "y": 1150,
        "id": "api-image-away-logo",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 4,
        "apiField": "teamAwayLogo"
      },
      {
        "x": 1060,
        "y": 1330,
        "id": "text-watermark",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 5,
        "content": "@getkanva.io",
        "fontSize": 40,
        "fontFamily": "Bebas Neue, sans-serif",
        "textAnchor": "end",
        "opacity": 0.7
      }
    ],
    "backgroundColor": "#1a1a1a",
    "backgroundImageUrl": "",
    "useBackgroundPlaceholder": true
  }'::jsonb,
  true,
  NULL
);

-- 2. Game Day - 1 Spiel
INSERT INTO public.templates (name, supported_games, svg_config, is_system, user_id)
VALUES (
  'Game Day - 1 Spiel',
  1,
  '{
    "format": "4:5",
    "elements": [
      {
        "x": 540,
        "y": 190,
        "id": "text-gameday-title",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 1,
        "content": "GAME DAY",
        "fontSize": 216,
        "fontStyle": "normal",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 1
      },
      {
        "x": 540,
        "y": 243,
        "id": "api-text-datetime",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 2,
        "content": "{date} {time} {location}",
        "apiField": "date,time,location",
        "fontSize": 49,
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "700",
        "textAnchor": "middle"
      },
      {
        "x": 27,
        "y": 1150,
        "id": "api-image-home-logo",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 3,
        "apiField": "teamHomeLogo"
      },
      {
        "x": 243,
        "y": 1150,
        "id": "api-image-away-logo",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 4,
        "apiField": "teamAwayLogo"
      },
      {
        "x": 1060,
        "y": 1330,
        "id": "text-watermark",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 5,
        "content": "@getkanva.io",
        "fontSize": 40,
        "fontFamily": "Bebas Neue, sans-serif",
        "textAnchor": "end",
        "opacity": 0.7
      }
    ],
    "backgroundColor": "#1a1a1a",
    "backgroundImageUrl": "",
    "useBackgroundPlaceholder": true
  }'::jsonb,
  true,
  NULL
);

-- 3. Home Game - 2 Spiele
INSERT INTO public.templates (name, supported_games, svg_config, is_system, user_id)
VALUES (
  'Home Game - 2 Spiele',
  2,
  '{
    "format": "4:5",
    "elements": [
      {
        "x": 540,
        "y": 190,
        "id": "text-homegame-title",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 1,
        "content": "HOME GAME",
        "fontSize": 216,
        "fontStyle": "normal",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 1
      },
      {
        "x": 540,
        "y": 243,
        "id": "api-text-datetime",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 2,
        "content": "{date} {time} {location}",
        "apiField": "date,time,location",
        "fontSize": 49,
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "700",
        "textAnchor": "middle"
      },
      {
        "x": 27,
        "y": 950,
        "id": "api-image-home-logo-game1",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 3,
        "apiField": "teamHomeLogo",
        "gameIndex": 0
      },
      {
        "x": 243,
        "y": 950,
        "id": "api-image-away-logo-game1",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 4,
        "apiField": "teamAwayLogo",
        "gameIndex": 0
      },
      {
        "x": 27,
        "y": 1150,
        "id": "api-image-home-logo-game2",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 5,
        "apiField": "teamHomeLogo2",
        "gameIndex": 1
      },
      {
        "x": 243,
        "y": 1150,
        "id": "api-image-away-logo-game2",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 6,
        "apiField": "teamAwayLogo2",
        "gameIndex": 1
      },
      {
        "x": 1060,
        "y": 1330,
        "id": "text-watermark",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 7,
        "content": "@getkanva.io",
        "fontSize": 40,
        "fontFamily": "Bebas Neue, sans-serif",
        "textAnchor": "end",
        "opacity": 0.7
      }
    ],
    "backgroundColor": "#1a1a1a",
    "backgroundImageUrl": "",
    "useBackgroundPlaceholder": true
  }'::jsonb,
  true,
  NULL
);

-- 4. Game Day - 2 Spiele
INSERT INTO public.templates (name, supported_games, svg_config, is_system, user_id)
VALUES (
  'Game Day - 2 Spiele',
  2,
  '{
    "format": "4:5",
    "elements": [
      {
        "x": 540,
        "y": 190,
        "id": "text-gameday-title",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 1,
        "content": "GAME DAY",
        "fontSize": 216,
        "fontStyle": "normal",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 1
      },
      {
        "x": 540,
        "y": 243,
        "id": "api-text-datetime",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 2,
        "content": "{date} {time} {location}",
        "apiField": "date,time,location",
        "fontSize": 49,
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "700",
        "textAnchor": "middle"
      },
      {
        "x": 27,
        "y": 950,
        "id": "api-image-home-logo-game1",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 3,
        "apiField": "teamHomeLogo",
        "gameIndex": 0
      },
      {
        "x": 243,
        "y": 950,
        "id": "api-image-away-logo-game1",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 4,
        "apiField": "teamAwayLogo",
        "gameIndex": 0
      },
      {
        "x": 27,
        "y": 1150,
        "id": "api-image-home-logo-game2",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 5,
        "apiField": "teamHomeLogo2",
        "gameIndex": 1
      },
      {
        "x": 243,
        "y": 1150,
        "id": "api-image-away-logo-game2",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 6,
        "apiField": "teamAwayLogo2",
        "gameIndex": 1
      },
      {
        "x": 1060,
        "y": 1330,
        "id": "text-watermark",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 7,
        "content": "@getkanva.io",
        "fontSize": 40,
        "fontFamily": "Bebas Neue, sans-serif",
        "textAnchor": "end",
        "opacity": 0.7
      }
    ],
    "backgroundColor": "#1a1a1a",
    "backgroundImageUrl": "",
    "useBackgroundPlaceholder": true
  }'::jsonb,
  true,
  NULL
);

-- 5. Home Game - 3 Spiele
INSERT INTO public.templates (name, supported_games, svg_config, is_system, user_id)
VALUES (
  'Home Game - 3 Spiele',
  3,
  '{
    "format": "4:5",
    "elements": [
      {
        "x": 540,
        "y": 190,
        "id": "text-homegame-title",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 1,
        "content": "HOME GAME",
        "fontSize": 216,
        "fontStyle": "normal",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 1
      },
      {
        "x": 540,
        "y": 243,
        "id": "api-text-datetime",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 2,
        "content": "{date} {time} {location}",
        "apiField": "date,time,location",
        "fontSize": 49,
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "700",
        "textAnchor": "middle"
      },
      {
        "x": 27,
        "y": 750,
        "id": "api-image-home-logo-game1",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 3,
        "apiField": "teamHomeLogo",
        "gameIndex": 0
      },
      {
        "x": 243,
        "y": 750,
        "id": "api-image-away-logo-game1",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 4,
        "apiField": "teamAwayLogo",
        "gameIndex": 0
      },
      {
        "x": 27,
        "y": 950,
        "id": "api-image-home-logo-game2",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 5,
        "apiField": "teamHomeLogo2",
        "gameIndex": 1
      },
      {
        "x": 243,
        "y": 950,
        "id": "api-image-away-logo-game2",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 6,
        "apiField": "teamAwayLogo2",
        "gameIndex": 1
      },
      {
        "x": 27,
        "y": 1150,
        "id": "api-image-home-logo-game3",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 7,
        "apiField": "teamHomeLogo3",
        "gameIndex": 2
      },
      {
        "x": 243,
        "y": 1150,
        "id": "api-image-away-logo-game3",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 8,
        "apiField": "teamAwayLogo3",
        "gameIndex": 2
      },
      {
        "x": 1060,
        "y": 1330,
        "id": "text-watermark",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 9,
        "content": "@getkanva.io",
        "fontSize": 40,
        "fontFamily": "Bebas Neue, sans-serif",
        "textAnchor": "end",
        "opacity": 0.7
      }
    ],
    "backgroundColor": "#1a1a1a",
    "backgroundImageUrl": "",
    "useBackgroundPlaceholder": true
  }'::jsonb,
  true,
  NULL
);

-- 6. Game Day - 3 Spiele
INSERT INTO public.templates (name, supported_games, svg_config, is_system, user_id)
VALUES (
  'Game Day - 3 Spiele',
  3,
  '{
    "format": "4:5",
    "elements": [
      {
        "x": 540,
        "y": 190,
        "id": "text-gameday-title",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 1,
        "content": "GAME DAY",
        "fontSize": 216,
        "fontStyle": "normal",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 1
      },
      {
        "x": 540,
        "y": 243,
        "id": "api-text-datetime",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 2,
        "content": "{date} {time} {location}",
        "apiField": "date,time,location",
        "fontSize": 49,
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "700",
        "textAnchor": "middle"
      },
      {
        "x": 27,
        "y": 750,
        "id": "api-image-home-logo-game1",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 3,
        "apiField": "teamHomeLogo",
        "gameIndex": 0
      },
      {
        "x": 243,
        "y": 750,
        "id": "api-image-away-logo-game1",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 4,
        "apiField": "teamAwayLogo",
        "gameIndex": 0
      },
      {
        "x": 27,
        "y": 950,
        "id": "api-image-home-logo-game2",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 5,
        "apiField": "teamHomeLogo2",
        "gameIndex": 1
      },
      {
        "x": 243,
        "y": 950,
        "id": "api-image-away-logo-game2",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 6,
        "apiField": "teamAwayLogo2",
        "gameIndex": 1
      },
      {
        "x": 27,
        "y": 1150,
        "id": "api-image-home-logo-game3",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 7,
        "apiField": "teamHomeLogo3",
        "gameIndex": 2
      },
      {
        "x": 243,
        "y": 1150,
        "id": "api-image-away-logo-game3",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 8,
        "apiField": "teamAwayLogo3",
        "gameIndex": 2
      },
      {
        "x": 1060,
        "y": 1330,
        "id": "text-watermark",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 9,
        "content": "@getkanva.io",
        "fontSize": 40,
        "fontFamily": "Bebas Neue, sans-serif",
        "textAnchor": "end",
        "opacity": 0.7
      }
    ],
    "backgroundColor": "#1a1a1a",
    "backgroundImageUrl": "",
    "useBackgroundPlaceholder": true
  }'::jsonb,
  true,
  NULL
);

-- Insert Game Result System Templates
-- 7. Game Result - 1 Spiel
INSERT INTO public.templates (name, supported_games, svg_config, is_system, user_id)
VALUES (
  'Game Result - 1 Spiel',
  1,
  '{
    "format": "4:5",
    "elements": [
      {
        "x": 27,
        "y": 1323,
        "id": "api-text-result",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 1,
        "content": "{result}",
        "apiField": "result",
        "fontSize": 405,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "start",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 16,
        "paintOrder": "stroke fill"
      },
      {
        "x": 486,
        "y": 1323,
        "id": "api-text-result-detail",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 2,
        "content": "{resultDetail}",
        "apiField": "resultDetail",
        "fontSize": 81,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "400",
        "textAnchor": "start",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 3,
        "paintOrder": "stroke fill"
      },
      {
        "x": 648,
        "y": 14,
        "id": "api-image-home-logo",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 3,
        "apiField": "teamHomeLogo"
      },
      {
        "x": 864,
        "y": 14,
        "id": "api-image-away-logo",
        "type": "api-image",
        "width": 189,
        "height": 189,
        "zIndex": 4,
        "apiField": "teamAwayLogo"
      },
      {
        "x": 1060,
        "y": 1330,
        "id": "text-watermark",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 5,
        "content": "@getkanva.io",
        "fontSize": 40,
        "fontFamily": "Bebas Neue, sans-serif",
        "textAnchor": "end",
        "opacity": 0.7
      }
    ],
    "backgroundColor": "#1a1a1a",
    "backgroundImageUrl": "",
    "useBackgroundPlaceholder": true
  }'::jsonb,
  true,
  NULL
);

-- 8. Game Result - 2 Spiele
INSERT INTO public.templates (name, supported_games, svg_config, is_system, user_id)
VALUES (
  'Game Result - 2 Spiele',
  2,
  '{
    "format": "4:5",
    "elements": [
      {
        "x": 54,
        "y": 351,
        "id": "api-image-home-logo-game1",
        "type": "api-image",
        "width": 108,
        "height": 108,
        "zIndex": 1,
        "apiField": "teamHomeLogo",
        "gameIndex": 0
      },
      {
        "x": 243,
        "y": 351,
        "id": "api-image-away-logo-game1",
        "type": "api-image",
        "width": 108,
        "height": 108,
        "zIndex": 2,
        "apiField": "teamAwayLogo",
        "gameIndex": 0
      },
      {
        "x": 189,
        "y": 648,
        "id": "api-text-result-game1",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 3,
        "content": "{result}",
        "apiField": "result",
        "fontSize": 216,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 11,
        "paintOrder": "stroke fill",
        "gameIndex": 0
      },
      {
        "x": 378,
        "y": 648,
        "id": "api-text-result-detail-game1",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 4,
        "content": "{resultDetail}",
        "apiField": "resultDetail",
        "fontSize": 81,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "400",
        "textAnchor": "start",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 3,
        "paintOrder": "stroke fill",
        "gameIndex": 0
      },
      {
        "x": 27,
        "y": 675,
        "x2": 378,
        "y2": 675,
        "id": "line-separator",
        "type": "line",
        "stroke": "#ffffff",
        "strokeWidth": 5,
        "zIndex": 5
      },
      {
        "x": 54,
        "y": 891,
        "id": "api-image-home-logo-game2",
        "type": "api-image",
        "width": 108,
        "height": 108,
        "zIndex": 6,
        "apiField": "teamHomeLogo2",
        "gameIndex": 1
      },
      {
        "x": 243,
        "y": 891,
        "id": "api-image-away-logo-game2",
        "type": "api-image",
        "width": 108,
        "height": 108,
        "zIndex": 7,
        "apiField": "teamAwayLogo2",
        "gameIndex": 1
      },
      {
        "x": 189,
        "y": 864,
        "id": "api-text-result-game2",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 8,
        "content": "{result2}",
        "apiField": "result2",
        "fontSize": 216,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 11,
        "paintOrder": "stroke fill",
        "gameIndex": 1
      },
      {
        "x": 378,
        "y": 770,
        "id": "api-text-result-detail-game2",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 9,
        "content": "{resultDetail2}",
        "apiField": "resultDetail2",
        "fontSize": 81,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "400",
        "textAnchor": "start",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 3,
        "paintOrder": "stroke fill",
        "gameIndex": 1
      },
      {
        "x": 1060,
        "y": 1330,
        "id": "text-watermark",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 10,
        "content": "@getkanva.io",
        "fontSize": 40,
        "fontFamily": "Bebas Neue, sans-serif",
        "textAnchor": "end",
        "opacity": 0.7
      }
    ],
    "backgroundColor": "#1a1a1a",
    "backgroundImageUrl": "",
    "useBackgroundPlaceholder": true
  }'::jsonb,
  true,
  NULL
);

-- 9. Game Result - 3 Spiele
INSERT INTO public.templates (name, supported_games, svg_config, is_system, user_id)
VALUES (
  'Game Result - 3 Spiele',
  3,
  '{
    "format": "4:5",
    "elements": [
      {
        "x": 54,
        "y": 351,
        "id": "api-image-home-logo-game1",
        "type": "api-image",
        "width": 108,
        "height": 108,
        "zIndex": 1,
        "apiField": "teamHomeLogo",
        "gameIndex": 0
      },
      {
        "x": 243,
        "y": 351,
        "id": "api-image-away-logo-game1",
        "type": "api-image",
        "width": 108,
        "height": 108,
        "zIndex": 2,
        "apiField": "teamAwayLogo",
        "gameIndex": 0
      },
      {
        "x": 189,
        "y": 648,
        "id": "api-text-result-game1",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 3,
        "content": "{result}",
        "apiField": "result",
        "fontSize": 216,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 11,
        "paintOrder": "stroke fill",
        "gameIndex": 0
      },
      {
        "x": 378,
        "y": 648,
        "id": "api-text-result-detail-game1",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 4,
        "content": "{resultDetail}",
        "apiField": "resultDetail",
        "fontSize": 81,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "400",
        "textAnchor": "start",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 3,
        "paintOrder": "stroke fill",
        "gameIndex": 0
      },
      {
        "x": 27,
        "y": 675,
        "x2": 378,
        "y2": 675,
        "id": "line-separator-1",
        "type": "line",
        "stroke": "#ffffff",
        "strokeWidth": 5,
        "zIndex": 5
      },
      {
        "x": 54,
        "y": 891,
        "id": "api-image-home-logo-game2",
        "type": "api-image",
        "width": 108,
        "height": 108,
        "zIndex": 6,
        "apiField": "teamHomeLogo2",
        "gameIndex": 1
      },
      {
        "x": 243,
        "y": 891,
        "id": "api-image-away-logo-game2",
        "type": "api-image",
        "width": 108,
        "height": 108,
        "zIndex": 7,
        "apiField": "teamAwayLogo2",
        "gameIndex": 1
      },
      {
        "x": 189,
        "y": 864,
        "id": "api-text-result-game2",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 8,
        "content": "{result2}",
        "apiField": "result2",
        "fontSize": 216,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 11,
        "paintOrder": "stroke fill",
        "gameIndex": 1
      },
      {
        "x": 378,
        "y": 770,
        "id": "api-text-result-detail-game2",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 9,
        "content": "{resultDetail2}",
        "apiField": "resultDetail2",
        "fontSize": 81,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "400",
        "textAnchor": "start",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 3,
        "paintOrder": "stroke fill",
        "gameIndex": 1
      },
      {
        "x": 654,
        "y": 351,
        "id": "api-image-home-logo-game3",
        "type": "api-image",
        "width": 108,
        "height": 108,
        "zIndex": 10,
        "apiField": "teamHomeLogo3",
        "gameIndex": 2
      },
      {
        "x": 843,
        "y": 351,
        "id": "api-image-away-logo-game3",
        "type": "api-image",
        "width": 108,
        "height": 108,
        "zIndex": 11,
        "apiField": "teamAwayLogo3",
        "gameIndex": 2
      },
      {
        "x": 789,
        "y": 648,
        "id": "api-text-result-game3",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 12,
        "content": "{result3}",
        "apiField": "result3",
        "fontSize": 216,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "900",
        "textAnchor": "middle",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 11,
        "paintOrder": "stroke fill",
        "gameIndex": 2
      },
      {
        "x": 978,
        "y": 648,
        "id": "api-text-result-detail-game3",
        "fill": "#ffffff",
        "type": "api-text",
        "zIndex": 13,
        "content": "{resultDetail3}",
        "apiField": "resultDetail3",
        "fontSize": 81,
        "fontStyle": "italic",
        "fontFamily": "Bebas Neue, sans-serif",
        "fontWeight": "400",
        "textAnchor": "start",
        "letterSpacing": 0,
        "stroke": "#ffffff",
        "strokeWidth": 3,
        "paintOrder": "stroke fill",
        "gameIndex": 2
      },
      {
        "x": 627,
        "y": 675,
        "x2": 978,
        "y2": 675,
        "id": "line-separator-2",
        "type": "line",
        "stroke": "#ffffff",
        "strokeWidth": 5,
        "zIndex": 14
      },
      {
        "x": 1060,
        "y": 1330,
        "id": "text-watermark",
        "fill": "#ffffff",
        "type": "text",
        "zIndex": 15,
        "content": "@getkanva.io",
        "fontSize": 40,
        "fontFamily": "Bebas Neue, sans-serif",
        "textAnchor": "end",
        "opacity": 0.7
      }
    ],
    "backgroundColor": "#1a1a1a",
    "backgroundImageUrl": "",
    "useBackgroundPlaceholder": true
  }'::jsonb,
  true,
  NULL
);