import type { FeatureGridBlock as FeatureGridBlockType } from '@/payload-types';
import { CreditsInfo } from './CreditsInfo';
import { Section } from './Section';

// Feature grid: centered heading/subheading over a responsive card grid. Cards
// use surface-relative borders so they read on any background variant.
export function FeatureGrid({
  heading,
  subheading,
  features,
  background,
}: FeatureGridBlockType) {
  const playerSubheading = subheading === 'The essentials are visible before your team joins — entry, schedule, standings, and how prizes are handled.' ? 'The essentials are visible before you enter — entry, schedule, standings, and how prizes are handled.' : subheading;
  const showCredits = heading === 'Built for clean competition' || heading === 'Prize & entry rules' || heading === 'Prize, credits & entry rules';
  return (
    <>
      <Section
      background={background}
      fallback="dark"
      innerClassName="max-w-7xl"
    >
      {heading ? (
        <h2 className="display-title text-4xl sm:text-6xl">
          {heading}
        </h2>
      ) : null}
      {playerSubheading ? (
        <p className="body-copy mt-4 max-w-2xl">
          {playerSubheading}
        </p>
      ) : null}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(features ?? []).map((feature) => (
          <div
            key={feature.id}
            className="dark-card reveal p-6 transition-transform hover:-translate-y-1"
          >
            {feature.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={feature.iconUrl} alt="" className="mb-4 h-10 w-10" />
            ) : null}
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            {feature.description ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/60">
                {feature.description === 'Follow team points during tournament play and see the standings as results are recorded.' ? 'Follow player points during tournament play and see the standings as results are recorded.' : feature.description}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      </Section>
      {showCredits ? <CreditsInfo /> : null}
    </>
  );
}
