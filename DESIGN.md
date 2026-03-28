# Alexandria — High-End Editorial

## North Star: "The Digital Curator"

A scholarly, premium reading experience. Dense information made effortless through serif authority and generous whitespace.

## Colors

- _Primary (#094cb2):_ Links, primary actions, focus states only.
- _Surface tiers_ create hierarchy—no explicit borders. Use background shifts between surface-container-lowest → surface-dim.
- _Tertiary (#6d5e00):_ Archival gold for highlights and badges.
- _No-Line Rule:_ Never use 1px borders. Define boundaries through background color shifts.
- Use glassmorphism for floating menus (80% opacity + 20px backdrop-blur). Gradient CTAs from primary → primary_container.

## Typography

- _Headlines:_ Noto Serif — large, authoritative, generous leading.
- _Body:_ Inter — modern clarity for dense text.
- _Labels:_ Public Sans — archival metadata feel.

## Elevation

- Depth through tonal layering, not shadows. Stack surface tokens for natural elevation.
- Modals: extra-diffused shadows (24-40px blur, 4-6% opacity, tinted on_surface).
- If borders needed: "Ghost Border" — outline_variant at 15% opacity.

## Components

- _Buttons:_ Primary = gradient fill, Secondary = surface-high bg + primary text, Tertiary = text + hover underline.
- _Cards:_ No divider lines. Use spacing or alternating surface colors.
- _Inputs:_ White bg, ghost border, focus = primary border.

## Rules

- Use whitespace as structure. Serif for narrative text. One primary action per view.
- Never use sharp corners — minimum sm roundness.
