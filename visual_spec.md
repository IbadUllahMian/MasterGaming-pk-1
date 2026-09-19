# Visual Design Spec

## 1. Global Visual System
The design system establishes a premium, high-tech, dark-mode aesthetic highly suited for advanced SaaS, AI tools, or enterprise platforms. It relies on a foundation of absolute black and deep charcoal, creating depth through structural, thin-bordered "dark cards" rather than drop shadows or heavy gradients. The layout feels highly structured and precise. A single, intense neon green-yellow accent color is used with militant restraint to command attention and guide primary actions. The overarching tone is commanding, sophisticated, and deeply atmospheric, aided by massive, softly lit ambient background graphics.

## 2. Global Layout and Rhythm
- **Macro Composition:** Generous, open spacing between major sections (approx 160-240px gaps) allows the deep black background to breathe.
- **Containers:** Content is constrained to sensible max-widths (approx 1200px-1400px), but immersive background graphics stretch full-bleed.
- **Density Contrast:** Layouts frequently juxtapose massive, singular focal points (enormous headlines, a massive single image) against dense, highly structured multi-item grids or lists.
- **Alignment:** Relies on strict left-alignment within containers, except for Hero and Pre-Footer sections which utilize center alignment for dramatic effect.

## 3. Global Typography System
- **Family:** A clean, geometric sans-serif (resembling Inter or Plus Jakarta Sans) applied universally.
- **Display/Headlines:** Massive scale, pure white, tightly leaded (line-height ~1.05 to 1.1), with slight negative tracking (approx `-0.02em`). Designed to look structural and block-like.
- **Body/Paragraphs:** Optimized for reading. Smaller scale, looser, airy leading (~1.6), and rendered in a muted gray (`rgba(255, 255, 255, 0.6)`).
- **Utility Labels/Badges:** Small (12-14px), typically uppercase, widely tracked, used in pill containers as contextual kickers.
- **Emphasis Pattern:** Extreme size contrast within the same block (e.g., an enormous bold statistic placed immediately adjacent to a tiny, tracked-out label).

## 4. Global Color, Surface, and Effects
- **Backgrounds:** The root background is absolute black (`#000000`).
- **Surfaces (Dark Cards):** Containment is handled exclusively by "dark cards." These are filled with a barely elevated shade (`#111111` or `rgba(255, 255, 255, 0.03)`).
- **Borders:** Edges are defined by ultra-thin, semi-transparent strokes (`rgba(255, 255, 255, 0.08)`).
- **Shadows:** None. Depth is implied strictly through color elevation and borders against the black canvas.
- **Accent Color:** A stark neon green-yellow (approx `#D3FF24`). Used with extreme discipline. Never used for body text, links, or backgrounds. Reserved strictly for solid primary CTA buttons, active state text highlights, and tiny decorative dots.
- **Shape Language:** Moderate, uniform border radii (approx 16px-24px) on all cards and image containers. Perfect pill shapes (fully rounded) are used for buttons and contextual badges.

## 5. Global Motion Language
- **Ambient Motion:** Large graphical backgrounds feature continuous, looping, very slow time-based motion (e.g., rotation, drifting particles) that is independent of user scroll.
- **Entrance Reveals:** A universal `fade-in-up` animation triggers as elements enter the viewport.
    - *Family:* Entrance.
    - *Easing:* Smooth `ease-out` (no spring bounce).
    - *Distance:* Elements translate upwards approx 20-40px.
    - *Duration band:* Standard UI to Large Surface (~400-600ms).
- **Staggered Sequences:** When grids (feature cards, blog posts) or lists appear, they do not animate simultaneously. They reveal in a staggered sequence (left-to-right, top-to-bottom) with a ~50-100ms delay between items, acting as a coordinated wave.
- **Continuous Marquees:** Horizontal strips move via continuous, linear, time-based looping.

## 6. Motion Adaptation Rules
- **Viewport Trigger Fallback:** The `fade-in-up` scroll reveals typically trigger when an element crosses the bottom 10-15% of the viewport. **Constraint:** If the destination site features short sections or sparse content, this threshold must be reduced or fall back to an "in-view" trigger to prevent elements from never appearing if the user cannot scroll far enough.
- **Grouped-Unit Header Coordination:** Section headers (Badge, H2, Body text) must animate sequentially as a unified block. Do not animate the badge, wait a long time, and then animate the headline. The timing between these text elements should be tight (~100ms offset).

## 7. Global Imagery and Iconography
- **Photography Style:** Highly curated, premium. Portraits are strictly high-contrast black and white. Editorial/blog imagery features desaturated, textural, architectural, or nature-focused subjects with muted or warm color grading.
- **Framing:** Images are clipped neatly inside containers matching the global border radius. No borders or drops shadows are applied directly to images.
- **Iconography:** Clean, white, minimalist line art (~1.5px stroke). Often housed in small, dark, rounded-square containers inside feature cards.
- **Abstract UI Mockups:** Used frequently in feature sections. These mockups follow the site's design system (dark cards, neon dots, white text) rather than simulating a bright, colorful external application.

## 8. Persistent Interface Layers
- **Floating Primary CTA:** A solid neon pill button pinned to the bottom right of the viewport, maintaining conversion visibility.
- **Secondary Platform Badge:** A smaller, dark, pill-shaped badge floating directly below or near the primary CTA.

## 9. Section Archetypes
- Immersive Hero
- Logo Ticker
- Metric & Quote Split
- Bento Feature Showcase
- Standard Feature Grid
- Scrolling Marquee
- Featured Testimonial
- Pricing Tier Split
- FAQ Accordions
- Sticky Timeline
- Pinned Portrait Sequence (Interactive Roster)
- Editorial Reading View
- Pre-Footer Conversion

## 10. Archetype-by-Archetype Detailed Spec

### Immersive Hero
- **Purpose:** Primary landing visual; establishes the premium tone.
- **Layout:** Centered content stack over a massive background graphic.
- **Typography:** Badge -> Enormous H1 -> Muted Body -> CTA Row.
- **Imagery:** A large 3D/WebGL background graphic (e.g., a planet). **Implementation Clue:** The graphic must be heavily masked with a radial gradient or vignette to pure black at the edges so it fades seamlessly into the page background. Hard edges will break the immersive effect.
- **Motion:** Text lockup triggers a staggered `fade-in-up`. Background relies on slow, continuous, looping time-based motion.

### Logo Ticker
- **Layout:** Full-width horizontal strip.
- **Imagery:** Monochrome partner logos, muted opacity (~50%).
- **Motion:** Continuous linear infinite looping translation.

### Metric & Quote Split
- **Layout:** 2-column grid. Left: Text-heavy quote. Right: Statistics block.
- **Typography:** Left side uses large, readable body text. Right side uses massive numeric stats paired with tiny pill-badge labels, creating extreme contrast.

### Bento Feature Showcase
- **Layout:** Asymmetrical grid mixing square, vertical, and horizontal rectangular cards.
- **Content:** Cards mix text+icons, stylized abstract UI graphics, and singular graphic statements (e.g., a glowing 24/7 badge).

### Pricing Tier Split
- **Layout:** 2-column side-by-side cards with a top billing toggle.
- **Color Treatment & Distinctiveness:** 
    - Base Tier: Standard dark card styling (dark gray, white text).
    - Premium Tier: Complete inversion. The card background floods with the solid neon accent color. All internal text, borders, and icons flip to black. Features a white "Most Popular" overlapping pill badge on the top right edge.

### Sticky Timeline
- **Layout:** 2-column (desktop). Left column contains descriptive text. Right column contains a vertical sequence of dates/years and associated text.
- **Typography:** The dates in the right column act as massive graphical anchors (large, outlined, or subtly filled text).
- **Motion & Structure:** 
    - Desktop: The left column pins (`position: sticky`) in the viewport while the right column scrolls past.
    - Mobile: **Adaptation Constraint:** Degrades to a simple vertical stack. Sticky behavior is completely removed on narrow screens.

### Pinned Portrait Sequence (Interactive Roster)
- **Purpose:** Displaying a list of items (e.g., team members) tied to specific media.
- **Layout:** 2-column (desktop). Left: Vertical scrolling list of names/titles. Right: A single, large, pinned image container.

#### Motion pattern: Scroll-Linked Pinned Media Swap
- **Role:** Interactive media reveal driven by reading progress.
- **Storyboard:** 
    1. Section enters viewport. Right image container pins to the screen. Left list continues to scroll naturally.
    2. As a text item on the left crosses a vertical threshold (approx center of the pinned image), its text state becomes active (brighter white/neon).
    3. Simultaneously, the pinned image crossfades to match the active text item.
- **Sequence structure:** 2-column hybrid; left scrolls, right pins and swaps states.
- **State count:** Determined by list item count (e.g., 4-6).
- **Progression model:** Discrete scroll-scrubbed triggers.
- **Trigger:** Scroll intersection (list item crossing a specific vertical offset).
- **Motion family:** Scrubbed scroll tracking for text states; fast crossfade for media.
- **Anchor element:** The right-side image container.
- **Dependency variables:** Height of the left-side list items; viewport height.
- **Dwell quality:** Inherently low if the text items are short.
- **Scroll budget sufficiency:** **High Risk.** If the text items beneath the names are short, the user will scroll past the entire sequence too quickly.
- **Portability note:** 
    - **Essential to preserve:** The synchronized swap between the active list item and the pinned media.
    - **Do not copy literally:** The exact physical height of the text items from the source if they are short.
    - **Recalibration needed:** The destination site **must** apply significant artificial vertical padding (e.g., `15vh` to `25vh`) to each item in the left-hand scrolling list. This increases the total scroll distance (the "scroll budget"), ensuring each image remains on screen long enough to be viewed.
    - **Failure risk:** Without added padding, a normal scroll wheel movement will cause the images to flash by violently and finish too early.
- **Mobile Adaptation:** **Constraint:** On mobile, this layout abandons all sticky logic and renders as a flat vertical stack: Text -> Image -> Text -> Image. Do not attempt to force the sticky sequence on mobile.

### Editorial Reading View
- **Layout:** Single, width-constrained central column optimized for line-length readability.
- **Imagery:** Inline images fill the column width, maintaining the global border radius and desaturated color grading.

### Pre-Footer Conversion
- **Layout:** Centered, massive hero-like stack at the bottom of the page.
- **Distinctiveness:** A stylized UI mockup or graphical element peeks up from the absolute bottom edge of the section, partially cropped horizontally, visually bridging the gap into the footer.

## 11. Reusable Patterns and Motifs
- **The Section Header Lockup:** A strict compositional pattern used almost everywhere: A dark pill badge (often with a neon dot) stacked precisely above a massive, tightly-tracked H2, stacked above a single paragraph of gray body text.
- **The Neon Dot:** A recurring micro-motif (`•`) that appears inside badges, next to active states, and inside abstract UI graphics to draw the eye.
- **Card Anatomy:** Extremely dark background (`#111111`) + 1px subtle transparent border + uniform padding + small icon box (top left) + H3 title + gray description text. Absolutely no drop shadows.

## 12. Essential Traits to Preserve
- The extreme scarcity and discipline of the neon accent color.
- The reliance on pure black backgrounds and non-shadowed, thinly bordered dark cards for structure.
- The high scale contrast between massive, blocky headlines and airy, legible body text.
- The fluid, staggered `fade-in-up` entrance motion for grouped items.
- The elegant degradation of complex sticky desktop features into standard vertical stacks on mobile.

## 13. Build Guardrails and Anti-Simplification Warnings
- **Do not flatten the dark theme:** Coding LLMs often default to medium grays (e.g., `#222` or `#333`) for cards in dark mode. This will ruin the premium aesthetic. Cards must remain extremely dark, relying solely on the ultra-thin semi-transparent border to separate from the pure black canvas.
- **Do not overuse the accent color:** Do not apply the neon color to text links, general borders, or background gradients. Its impact relies entirely on restriction to primary buttons and micro-dots.
- **Do not ignore scroll sequence padding:** For the Pinned Portrait Sequence, you must artificially pad the height of the scrolling text list items. If you do not, the interaction will scroll by too fast and fail.
- **Do not force desktop layouts on mobile:** Sticky timelines and pinned media sequences must revert to standard vertical stacks on mobile screens.
- **Do not leave hard edges on background graphics:** Any large 3D/WebGL background replacements must be masked or vignetted heavily to black at the edges. Hard rectangular image bounds will break the immersive layout.

## 14. Redaction and Abstraction Notes
- Specific brand names, platform terminology, and UI data have been abstracted to generic terms ("contextual badge", "abstract UI mockup").
- Specific personnel names and roles have been generalized to "name" and "title".
- Specific statistics and dates have been generalized.
- All literal testimonial copy and client logos have been removed.