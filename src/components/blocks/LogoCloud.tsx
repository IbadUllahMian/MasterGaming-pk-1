import type { LogoCloudBlock as LogoCloudBlockType } from '@/payload-types';
import { Section } from './Section';

export function LogoCloud({ heading, logos, background }: LogoCloudBlockType) {
  return (
    <Section
      background={background}
      fallback="light"
      innerClassName="max-w-6xl"
    >
      {heading ? (
        <p className="text-center text-sm font-semibold uppercase tracking-wide opacity-60">
          {heading}
        </p>
      ) : null}
      <div
        className={`flex flex-wrap items-center justify-center gap-x-10 gap-y-6 ${
          heading ? 'mt-8' : ''
        }`}
      >
        {(logos ?? []).map((logo) => {
          // eslint-disable-next-line @next/next/no-img-element
          const img = (
            <img
              src={logo.imageUrl}
              alt={logo.alt ?? ''}
              className="h-8 w-auto object-contain opacity-70 transition-opacity hover:opacity-100"
            />
          );
          return logo.href ? (
            <a key={logo.id} href={logo.href} className="inline-flex">
              {img}
            </a>
          ) : (
            <span key={logo.id} className="inline-flex">
              {img}
            </span>
          );
        })}
      </div>
    </Section>
  );
}
