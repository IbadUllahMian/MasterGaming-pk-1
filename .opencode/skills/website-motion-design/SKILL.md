---
name: website-motion-design
description: >
  Use this skill whenever you add, edit, or review motion on a generated
  website — entrance reveals, hover or press feedback, opening and closing
  surfaces (menus, modals, accordions, tabs), staggered text or stat reveals,
  loading states, or any transition/animation work. Trigger even when the
  user just says "add some animation", "make it feel alive", "this feels
  static", or "make it smoother". Covers how much motion a site should get,
  the pattern menu of default treatments, timing and easing, multi-element
  choreography, animation performance, and reduced-motion accessibility.
  For carousel, slider, and marquee mechanics prefer the
  website-carousel-building skill; for UI driven strictly by page-scroll
  position (pinned visuals, scrollytelling, scroll-spy navs) prefer the
  website-scroll-management skill.
mode: both
---

# Website motion design

How to decide, design, and implement motion on generated websites. The design
spec owns *whether and where* a page is motion-led; this skill owns *how*
motion is executed.

<!-- CANONICAL motion doctrine. One derived condensation exists:
     backend/app/llm/coding/website_create/system-prompt-website-create.md § "Motion"
     (the create fan-out needs the menu present at implementation time, not behind a
     skill load). Edit this skill FIRST, then mirror any vocabulary/rule change
     there — drift between the two is a review blocker. -->

For every motion decision, work in this order: assign the element a tier,
pick its treatment from the pattern menu, take timing from the tables, and
verify against the checklist at the end.

## Motion tiers — how much motion the site gets

Pick the tier per element. Authority order: explicit user request → design /
visual spec → these defaults. When signals conflict, the higher authority
wins outright (a user asking for animation overrides a calm spec, and vice
versa).

1. **Feedback (always).** Every interactive element transitions between its
   states: hover, focus-visible, press, open/close. Fast and quiet
   (100–250ms). A site with zero feedback motion is broken, not minimal.
2. **Structure (default).** Entrance and state motion chosen per section
   from the pattern menu — at most one entrance treatment per major section,
   fitted to what the section contains. Vary the treatment across the page:
   every menu entry is an equal candidate, and a page where each section
   plays the same fade-up reads as templated. Skip entrances when the spec
   or brand uses language like *editorial, minimal, quiet, calm,
   understated*, or the user asks for a static feel.
3. **Expression (only when called for).** Decorative and atmospheric motion:
   3D hover tilt, shimmer, animated backgrounds, multi-stage choreographed
   scenes. Unlock this tier only on an explicit signal: the spec or brand
   uses language like *motion-led, expressive, playful, dynamic, bold,
   immersive, cinematic*, or the user asks for it directly.

A spec that says nothing about motion means tiers 1 + 2 — not zero motion,
and not tier 3.

## Technique: CSS plus the template's scroll-reveal primitive

- **CSS transitions/animations** (Tailwind classes) for anything with a
  single start and end state: feedback, open/close surfaces, accordion
  expand, tab pill slide, shimmer. No animation packages — the templates
  ship none, and `package.json` is platform-managed.
- **Viewport-triggered motion** runs on the template primitive in
  `src/components/scroll-reveal.tsx`, mounted site-wide by the layout:
  - Put the `reveal` class on any element that should fade + rise in as it
    enters the viewport. Stagger siblings with stepped `transition-delay`
    (60–80ms apart).
  - Call `useInView` (same file) when entering the viewport should run a
    callback — count-ups, chart entrance plays. It fires once, and fires
    immediately under reduced motion so the final state always renders.
  - Never hand-roll an `IntersectionObserver` for entrance work, and never
    write reveal CSS that hides content outside the `html.js` gate.
- On a site that predates the primitive (`src/components/scroll-reveal.tsx`
  absent), port the whole contract together from the template — component,
  gated `globals.css` block, layout mount, and js-class bootstrap. The
  contract is all-or-nothing: reveal CSS without a mounted observer hides
  content forever.

## Pattern menu — default treatment by situation

Every entry is an equal candidate; match the treatment to the section's
content.

| Situation | Default treatment |
| --- | --- |
| Element entering on scroll | `reveal` class — the mounted observer animates it |
| Hero headline + subcopy + CTA | staggered rise: `reveal` on each child, stepped `transition-delay` |
| Stats / metric row | count-up or pop-in driven by `useInView`, once, staggered 60–80ms |
| FAQ / accordion | `grid-template-rows: 0fr → 1fr` on the panel (padding on the inner div, never the track); flip the chevron with `scaleY(-1)`, not an SVG path morph (path interpolation is Chromium-only) |
| Mobile nav drawer | transform slide + backdrop fade, one shared duration/easing |
| Dropdown / popover | scale from ~0.97 + fade, `transform-origin` at the trigger |
| Card hover | small lift (`-translate-y-1`) + shadow, 150ms; tilt is expression-tier |
| Buttons | `active:scale-[0.97]` press feedback |
| Form error | shake + border color that auto-reverts; keep error styling and shake as separate classes so the shake can replay |
| Form success | icon swap or check-draw moment |
| Rotating / swapping text | cross-fade in place with a 2–3px blur |
| Skeleton loading | pulse, then cross-fade to content |
| Logo strip / marquee, carousels | `website-carousel-building` skill |
| Scroll-pinned, scrollytelling, scroll-spy | `website-scroll-management` skill (its managed elements never carry `reveal`) |

## Timing

Easing by what the element is doing: entering or exiting the screen →
strong ease-out (`cubic-bezier(0.165, 0.84, 0.44, 1)`, registered once in
`@theme` as `--ease-out-quart`); moving or morphing on-screen →
`ease-in-out`; hover and color changes → `ease`; marquee, spinner,
progress → `linear`. `ease-in` reads as lag — reserve it for exits paired
with an ease-out entrance, never for anything entering.

| What | Duration |
| --- | --- |
| Hover / press feedback | 100–150ms |
| Dropdowns, tooltips, tabs | 150–250ms |
| Modals, drawers, accordions | 200–300ms |
| Section entrance reveals | 400–600ms |
| Stagger step between siblings | 40–80ms |

Exits run faster than entrances (close ≈ ⅔ of open). Interactive UI stays
under 300ms; only entrance reveals go longer. Paired elements that move as
a unit (drawer + backdrop, tooltip + arrow) share one duration and easing.

## Choreography — name every number

Any component with 3+ animated elements extracts its timing into named
constants with a storyboard comment, so later edits ("make it slower") are
one-constant changes — zero magic numbers inline in JSX:

```tsx
/* ANIMATION STORYBOARD — ms after section enters view
 *    0ms  heading rises in
 *   80ms  subcopy follows
 *  160ms  CTA row follows
 */
const REVEAL_STAGGER_MS = 80;
```

## Performance

- Animate only `transform`, `opacity`, and small `filter: blur()` (≤ 8px).
  Height changes go through the grid-rows technique, movement through
  transforms — never animate width/height/padding/margin.
- Enumerate transitioned properties (`transition-[transform,opacity]` or
  `transition-transform`); `transition-all` picks up unrelated style
  changes.
- When hover moves an element, animate a child, not the hover target
  itself — otherwise the target slips out from under the cursor and
  flickers.
- Viewport triggers fire once — re-running reveals on every scroll pass
  reads as broken. The primitive already does this; keep it that way in
  custom code.
- Pause looping animations while off-screen, and run looping or ambient
  motion only where the visitor can ignore it; anything that demands
  attention starts from a visitor action.

## Reduced motion

The template's `globals.css` carries a site-wide `prefers-reduced-motion`
guard (animations and transitions collapse to a single frame), and the
scroll-reveal block carries its own override. Keep both; on a site missing
the guard, add it while you are doing motion work. `useInView` fires
immediately under reduced motion — custom triggered code must render its
final state, not skip it. Content must read complete without motion:
above-the-fold copy is never left at `opacity: 0` waiting for a trigger,
and every reveal's final state is the fully visible one.

## Hard limits

- Scroll behaves natively: motion may respond to scroll position 1:1, but
  never hijacks, snaps, or retimes the user's scrolling.
- High-frequency targets (nav links, toggles hit dozens of times per
  session) get fast feedback (≤150ms) and nothing more elaborate.
- Space is reserved from first paint: a reveal may fade and translate, but
  never animates the height of the page as it loads (zero CLS from motion).
- Theme toggles swap colors with transitions suspended for the duration of
  the swap, so the change lands as one clean frame.

## Definition of done

- [ ] Animated properties are limited to `transform`, `opacity`, and small
      `blur()`.
- [ ] Viewport-triggered motion runs on the template primitive (`reveal` /
      `useInView`) — no hand-rolled observers, no ungated reveal CSS.
- [ ] The reduced-motion guard is present in `globals.css`, and the page
      reads complete with motion off.
- [ ] Every expression-tier treatment traces to an explicit
      spec/brand/user signal.
- [ ] Multi-element sequences read from named constants — no magic numbers
      in JSX.
