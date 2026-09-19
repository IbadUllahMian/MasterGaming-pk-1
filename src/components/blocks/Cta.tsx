import type { CtaBlock as CtaBlockType } from '@/payload-types';
import { Section, surfaceButtonClasses } from './Section';

// Closing CTA band. Defaults to a dark surface so it stands out from the page;
// the button inverts against the surface. Generated designs restyle this per
// brand — the template keeps it neutral.
export function Cta({
  heading,
  body,
  ctaLabel,
  ctaHref,
  background,
}: CtaBlockType) {
  const playerBody = body === 'Register your Free Fire squad and request tournament confirmation.' ? 'Register as an individual player and request tournament confirmation.' : body;
  const playerCtaLabel = ctaLabel === 'Enter your team' ? 'Enter as a player' : ctaLabel;
  return (
    <Section background={background} fallback="dark" innerClassName="max-w-3xl">
      {({ dark }) => (
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {heading}
          </h2>
          {body ? (
            <p className="max-w-2xl text-lg leading-relaxed opacity-80">
              {playerBody}
            </p>
          ) : null}
          {playerCtaLabel && ctaHref ? (
            <a
              href={ctaHref}
              className={`mt-2 inline-block rounded-md px-6 py-3 text-sm font-medium transition-colors ${surfaceButtonClasses(dark)}`}
            >
              {playerCtaLabel}
            </a>
          ) : null}
        </div>
      )}
    </Section>
  );
}
