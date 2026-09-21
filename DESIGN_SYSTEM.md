# DESIGN_SYSTEM.md

The official design reference for Care Companion. Every future page must follow this file.

---

## 1. Project overview

- **Website / product name:** Care Companion (เพื่อนเดินทาง)
- **Website type:** marketplace web app + marketing landing + admin
- **Surface profile:** hybrid Landing/Marketing + App/Product UI + Dashboard/Admin
- **Platform:** web (responsive, mobile-first)
- **Target users:** Thai customers who need a travel buddy for errands; companions who take jobs; a class admin
- **Main design goal:** feel like a daytime Bangkok ride marketplace, never like a hospital portal

## 2. Brand direction

- **Visual style:** bold street-sign marketplace
- **Mood & tone:** hot, clear, going-together
- **Design personality:** kinetic / street-smart / trustworthy-enough
- **Design concept:** a daytime songthaew ride ticket — oversized Thai signage type, A→B route ribbon as hero art, taxi-plate companion cards, numbered route for how-it-works (not SaaS cards)
- **Adversarial-review verdict:** Cover the name and it still reads as route tickets + plates, not a generic marketplace. Weakness found this pass: identical 3-up how-to cards and flame-on-paper at 3.75:1 — fixed (route steps + darker flame 4.9:1)
- **Reference style used:** Jay Nok Modern Thai (WE Awards) — bold Thai type, skip neon nightlife; typographic-confidence marketplaces (one accent); songthaew route boards / taxi plates. No Grab green.
- **Voice & UX copy:** Thai written first, short verbs, no ดำเนินการ/กรุณาทำการ. CTAs: หาเพื่อนเดินทาง / สร้างคำขอ / ยอมรับ

## 3. Color system

| Role | Color | Hex | Contrast |
|---|---|---|---|
| 60% — Dominant | Paper | `#F6F7F9` | gallery white (Linear/Vercel light) |
| 30% — Secondary | Ink / plate / mist | `#14161C` / `#111318` / `#EEF0F4` | paper on ink **16.9:1** |
| 10% — Accent | Coral | `#D20F45` | paper on coral **5.03:1** (AA body) |
| Ink-soft | Supporting | `#4E535C` | **7.21:1** on paper |
| Signal | Hi-vis lemon | `#F5C518` | ink on lemon **11.1:1** |
| OK | Success | `#047857` | **5.12:1** on paper |
| Danger | Stop | `#BE123C` | **5.86:1** on paper |

**Usage rules**
- Backgrounds: cool paper, one faint coral wash (not cream/gold blobs)
- Text: ink on paper, paper on ink/flame
- Buttons: flame pill with hard bottom edge (physical, not glassy)
- Cards: companion = dark plate; trips = paper with tinted shadow, not a 1px border as elevation
- Highlights / focus: 3px flame ring via `:focus-visible`
- Separation: background shift + `--shadow-raise` / `--shadow-plate`
- **Dark mode:** optional via the header sun toggle (`html.dark`, persisted as `cc-theme`). Default stays light. `--colorOnAccent` is always gallery white for text on flame/plate.

## 4. Typography system

- **Brand personality:** bold-loud + Thai-readable
- **Font family / pairing:** Chakra Petch (display) + Anuphan (body)
- **Why these fonts fit:** Chakra Petch is a Thai industrial/sport face used on signage, not a Latin-only grotesque. Anuphan is a Thai UI face from Cadson Demak.
- **Type scale**
  - display: `clamp(2rem, min(7.2vw, 11vh), 4.4rem)` / leading 0.95 (`--sizeDisplay`)
  - h1: 2.25rem (`--sizeH1`)
  - h2: 1.75rem (`--sizeH2`)
  - h3: 1.25rem
  - body-lg: 1.125rem
  - body: 1rem (16px minimum)
  - body-sm: 0.875rem
  - caption: 0.75rem uppercase tracked
  - button: 1rem semibold
- **Line-height / line-length:** body ~1.5, measure ~65ch
- **Button text style:** semibold, tracking-wide, never sentence-long
- **Responsive rules:** hero type uses `min(vw, vh)` via clamp; product UI uses rem

## 5. Layout system

- **Container widths:** `max-w-6xl` marketing/app, `max-w-3xl` forms, `max-w-2xl` prose
- **Section spacing:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 (`--space-4xl` between major bands; trust bar stays tight)
- **Grid rules:** 1 col mobile, 2–3 col from md; auto-fit cards `minmax` where listing
- **Page anatomy / section order (landing):** navbar → oversized typographic hero with A→B ribbon → ink trust bar → problem list → numbered how-to → companion plates → flame closing CTA → footer
- **Conversion / CTA flow:** one primary label **หาเพื่อนเดินทาง** on hero and closing band; secondary มาเป็นเพื่อนเดินทาง; nav เข้าใช้ is auth, not the same intent
- **Hero composition:** oversized-typographic, centered in `min-h-[calc(100svh-5rem)]`. Striking move: dark A→B route ribbon under the headline (not a left-text/right-image split)
- **Horizontal card rails:** none on landing; listings wrap
- **Breakpoints:** 375 / 768 / 1280
- **Alignment rules:** marketing hero centered; app pages left-aligned

## 6. Component system

- **Component base / library:** custom primitives — CSS Modules (`.root`) for Button, Field, EmptyState, LanguageSwitcher + Tailwind layout. Uiverse remixed: learn-more, glow-card, theme-toggle, login-form, error-alert, orbit-cards.
- **Buttons:** pill; variants primary/secondary/ghost/danger/plate; sizes sm/md/lg; `:hover`/`:focus-visible`/`:active`/`:disabled` (disabled `cursor: default`); loading spinner + `aria-busy`; hard offset shadow
- **Cards:** trip = paper raise; companion = ink plate
- **Badges:** StatusPill, rounded-full, uppercase
- **Navbar:** sticky, 80px, wordmark + sun theme toggle + lang switch + auth
- **Footer:** ink bar, disclaimer + privacy
- **Forms:** label above, inset ring, 48px controls
- **Inputs:** 16px text, 2xl radius

## 7. Card & section style

- **Chosen style:** mixed — paper raise + ink plates
- **Radius:** 24–32px surfaces, full pills for actions
- **Shadow / elevation:** `--shadow-raise`, `--shadow-plate` (hard offset)
- **Gradients:** background washes only, never text
- **Glassmorphism:** none except light header blur
- **Rule:** no nested elevated cards; companion plates are the loud object

## 8. Icon system

- **Icon library:** Phosphor (`@phosphor-icons/react`), weight bold/fill
- **Icon size:** 20–24px inline, 32px trust bar
- **Icon color:** currentColor, gold on ink
- **Usage rules:** icon-only controls need accessible names

## 9. Image & asset rules

- **Logo:** generated pin-with-two-walkers, `public/logo.png`; also SVG wordmark in `components/brand/logo.tsx`
- **User-provided images:** avatars forced into 56px rounded square
- **AI-generated images:** logo only
- **Crop style:** square avatars, cover
- **Radius:** 16px avatars
- **Visual treatment:** no stock hospital photography

## 10. Animation & interaction system

- **Animation library:** CSS-only
- **Hover states:** translate-y on plates/buttons
- **Button interaction:** press compresses the offset shadow
- **Cursor pointer rules:** all buttons/links
- **Interaction states:** default / hover / focus-visible / active / disabled
- **Async feedback:** button loading + inline error text
- **Toast / inline message system:** inline errors (no toast library)
- **Form feedback:** required markers, hint under field
- **Data view states:** EmptyState, Skeleton, error copy
- **Reduced-motion support:** global media query kills transitions
- **Performance:** animate transform/opacity only; maps code-split; fonts `display: swap`

## 11. Accessibility rules

- **Contrast rules:** ink on paper, paper on flame/ink — body ≥ 4.5:1
- **Focus states:** `:focus-visible` 3px flame
- **Keyboard navigation:** native controls, skip link
- **Semantics & ARIA:** landmarks, labeled forms
- **System adaptation:** reduced motion, 16px minimum body, Thai+Latin fonts
- Never rely on color alone — status pills have text

## 12. Anti-AI-slop rules

- **Approved palette:** paper, ink, mist, flame, gold, ok, danger as in §3
- **Pure `#000`/`#fff` used?** No
- **Concept-test verdict:** route-plate marketplace, not medical teal, not purple SaaS
- **Project-specific exceptions:** light-only theme (daytime errands). No Lucide.

## 13. Future page instructions

Reuse tokens, Chakra Petch + Anuphan, flame pills, ink plates. Do not introduce a new visual style unless this file is updated.

## 14. Update policy

If colors, type, components, or icons change, update this file in the same change.
