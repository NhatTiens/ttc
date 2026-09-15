# Tương Tác Pro - Design System Notes

## Visual direction

The application shell is intentionally calm and operational rather than promotional: light neutral workspace, dark navy navigation, one clear blue action color, white cards, light borders, and restrained shadows. Platform brand colors are limited to platform identity elements instead of leaking into the general interface.

## Token policy

Design values live in `apps/web/src/app/globals.css` under `:root`. Components consume variables instead of defining their own one-off colors. Main groups:

- Surfaces: `--color-bg`, `--color-surface`, `--color-surface-soft`.
- Brand/action: `--color-primary`, hover/soft/focus variants.
- Navigation: `--color-navy` plus sidebar-specific semantic tokens.
- Semantic state: success, warning, danger, purple/refund.
- Borders/shadows/radius.
- Platform colors for Facebook, TikTok, Instagram, YouTube, Threads.
- Layout dimensions: desktop sidebar, tablet rail, topbar, mobile navigation.

Tailwind is available as the utility layer, while the shared components use semantic class names so repeated visual decisions remain centralized. `components.json` keeps the project compatible with shadcn/ui additions in later phases.

## Responsive shell

| Width | Navigation | Main behavior |
|---:|---|---|
| 1440 | Full navy sidebar | 32 px content gutters |
| 1280 | Full navy sidebar | 32 px content gutters |
| 1024 | Compact tablet rail | 20 px content gutters |
| 768 | Compact tablet rail | 20 px content gutters |
| 430 | Dedicated bottom navigation | One-column content, 16 px gutters |
| 390 | Dedicated bottom navigation | One-column content, 16 px gutters |
| 375 | Dedicated bottom navigation | Compact topbar, 12 px gutters |

Mobile does not render a shrunken desktop sidebar. Five primary destinations live in the fixed bottom navigation. The topbar menu opens a separate drawer for the complete navigation set.

## Status mapping

- Processing -> blue.
- Completed -> green.
- Pending -> amber.
- Failed -> red.
- Cancelled -> neutral.
- Partial -> purple.
- Refunded -> purple.

Status meaning is centralized in the badge layer, so pages should pass a status value instead of choosing colors themselves.

## Accessibility rules

- All interactive controls have a visible focus state.
- Form controls use explicit labels and `aria-describedby` for hint/error text where applicable.
- Modal/drawer use native `<dialog>` semantics for focus containment and Escape handling.
- Tabs support Left/Right/Home/End keyboard navigation.
- Sidebar/mobile route links expose `aria-current`.
- AppShell includes a keyboard-accessible skip link.
- Responsive tables retain a semantic desktop table and a labeled mobile list representation.
- Motion is reduced when `prefers-reduced-motion` is enabled.

## Usage rule for later pages

Business pages should compose these primitives instead of copying CSS. If a visual requirement cannot be expressed by existing tokens/components, extend the token/component once first, then use it on the page.
