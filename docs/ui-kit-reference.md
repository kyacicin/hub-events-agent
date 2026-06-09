# UI Kit Reference

Source: https://www.figma.com/design/Bayz0NKz49ZEZZnPaWLoSy/3-Free-AI-Chatbot-App-UI-Kit--Community-?node-id=10301-23319

## Access Notes

- Public Figma view loaded in view-only mode.
- Retry after Google SSO callback still showed Figma's sign-up/inspect gate.
- Exact inspect data, CSS exports, and font metadata were gated by Figma sign-up/inspect access.
- Further browser interaction was blocked once the active modal tried to continue Google sign-up.
- Use the notes below as a visual reference, not as an exact token export.

## Visible Frames

Fit-to-canvas view showed three `Desktop` frames:

1. Answer workspace frame: Perplexity-style layout with source cards, answer body, right media overview, and left history rail.
2. Chat conversation frame: assistant/user chat layout with large rounded message bubbles, user avatar, and a purple/blue bot badge.
3. Answer/search frame: selected AI answer workspace with top breadcrumbs, source cards, main answer content, and overview panel.

### Answer Workspace

Visible structure:
- Left navigation rail with product name, search, and stacked history/items.
- Top breadcrumb row with nested location labels.
- Main answer column with a large question title.
- Source cards directly under the title.
- Answer section with icon label and body copy.
- Right overview panel with image tiles.
- Floating bottom toolbar/input controls.

### Chat Conversation Frame

Visible structure:
- Left sidebar rail with pale surface and compact navigation/history rows.
- Main conversation column on white background.
- User message row with circular photo avatar, bold `You` label, muted timestamp, and a very rounded light message bubble.
- Assistant row with circular soft-lavender bot avatar and blue/purple line icon.
- Assistant identity appears as `slothGPT` with muted timestamp.
- Message/media cards use very large radii and low-contrast borders.
- Overall density is spacious, but controls and metadata stay compact.

## Typography

Observed style:
- Modern neutral sans-serif, visually close to Inter or SF Pro.
- Large title: heavy weight, tight line-height, dark neutral text.
- Section labels: medium/semibold, compact.
- Body text: 14-16px range, comfortable line-height.
- Metadata and secondary labels: 12-13px, muted gray.

Recommended implementation stack:

```css
font-family: Inter, "SF Pro Text", "Segoe UI", Arial, sans-serif;
```

## Components To Reuse

- Source card: compact bordered card with title, secondary URL/source, and small leading icon.
- Answer block: label row with icon, then structured body copy.
- Overview panel: right-side contextual panel with rounded media grid.
- Conversation input: sticky/floating bottom composer with compact tool buttons.
- Sidebar history: searchable navigation with grouped recent items.

## Visual Tokens

- Page background: cool light gray.
- Surfaces: white cards/panels.
- Borders: very light gray-blue.
- Primary text: near-black blue/gray.
- Secondary text: muted slate.
- Accent: restrained blue for active/interactive states.
- Radius: 8-12px for cards and controls.
- Layout density: compact, app-like, no marketing hero treatment.

## How To Apply To This App

- Keep the first screen as the chat product surface.
- Prefer compact result cards over large decorative panels.
- Move event source links into source-card style actions.
- Keep the assistant reply plus structured event/staff cards in one readable answer column.
- Use a right-side or sidebar panel for context only on wide screens.
