import type { StatsBlock as StatsBlockType } from '@/payload-types';
import { Section } from './Section';

export function Stats({ heading, stats, background }: StatsBlockType) {
  const playerHeading = heading === 'A tournament desk built for teams' ? 'A tournament desk built for players' : heading;
  const items = stats ?? [];
  // 2 cols on mobile; up to 4 across on desktop, but never more columns than cells.
  const cols = Math.min(items.length || 1, 4);
  const lgCols = [
    '',
    'lg:grid-cols-1',
    'lg:grid-cols-2',
    'lg:grid-cols-3',
    'lg:grid-cols-4',
  ][cols];

  return (
    <Section
      background={background}
      fallback="dark"
      innerClassName="max-w-7xl"
    >
      {playerHeading ? (
        <h2 className="display-title text-4xl sm:text-6xl">
          {playerHeading}
        </h2>
      ) : null}
      <dl
        className={`grid grid-cols-2 gap-4 md:grid-cols-4 ${lgCols} ${
          playerHeading ? 'mt-10' : ''
        }`}
      >
        {items.map((stat) => (
          <div key={stat.id} className="dark-card reveal p-5">
             <dt className="display-title text-4xl text-white md:text-5xl">{stat.value}</dt>
             <dd className="mt-2 text-[11px] font-semibold uppercase tracking-[.15em] text-white/45">{stat.label}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
