import type { ReactNode } from 'react';

// Section background variants → neutral surface classes. The optional per-block
// `background` field (schema in payload/blocks/index.ts) selects one; when empty
// the block component passes its own `fallback`. This is the reusable mechanism
// for a light/dark section rhythm — surfaces are neutral by default, and a
// generated design overrides the look per brand.
export type SectionBackground = 'light' | 'muted' | 'dark' | null;

const SURFACE: Record<NonNullable<SectionBackground>, string> = {
  light: 'bg-black text-white',
  muted: 'bg-[#080808] text-white',
  dark: 'bg-black text-white',
};

export function isDarkSurface(bg: SectionBackground | undefined): boolean {
  return bg === 'dark';
}

export function resolveBackground(
  background: SectionBackground | undefined,
  fallback: NonNullable<SectionBackground>,
): NonNullable<SectionBackground> {
  return background && SURFACE[background] ? background : fallback;
}

// A solid button that inverts against its surface: white on dark, dark on light.
// Single source for the contrast rule shared by Hero and Cta.
export function surfaceButtonClasses(dark: boolean): string {
  return dark
    ? 'bg-[#d3ff24] text-black hover:bg-[#e2ff66]'
    : 'bg-[#d3ff24] text-black hover:bg-[#e2ff66]';
}

export function Section({
  background,
  fallback = 'light',
  className = '',
  innerClassName = 'max-w-7xl',
  children,
}: {
  background?: SectionBackground;
  /** Variant used when `background` is empty — the block's default surface. */
  fallback?: NonNullable<SectionBackground>;
  className?: string;
  innerClassName?: string;
  /**
   * Section content. Pass a function to receive the resolved surface
   * (`{ dark }`) so a block can style against the same surface Section paints —
   * one source of truth instead of resolving the background twice.
   */
  children: ReactNode | ((surface: { dark: boolean }) => ReactNode);
}) {
  const bg = resolveBackground(background, fallback);
  const content =
    typeof children === 'function'
      ? children({ dark: isDarkSurface(bg) })
      : children;
  return (
    <section
      className={`relative ${SURFACE[bg]} px-5 py-20 sm:px-8 md:py-32 ${className}`}
    >
      <div className={`relative mx-auto ${innerClassName}`}>{content}</div>
    </section>
  );
}
