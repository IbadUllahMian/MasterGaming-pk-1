import type { AudioEmbedBlock as AudioEmbedBlockType } from '@/payload-types';
import { Section } from './Section';

// Audio embed. Renders a provider player from its embed URL in a
// responsive iframe. Provider is informational (used for the iframe title);
// `embedUrl` is the provider's player URL. The component is brand-agnostic;
// generated designs restyle the wrapper.
export function AudioEmbed({
  heading,
  provider,
  embedUrl,
  caption,
  background,
}: AudioEmbedBlockType) {
  if (!embedUrl) return null;
  return (
    <Section
      background={background}
      fallback="muted"
      innerClassName="max-w-3xl"
    >
      {heading ? (
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          {heading}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-xl">
        <iframe
          src={embedUrl}
          title={heading ?? `${provider ?? 'audio'} player`}
          loading="lazy"
          allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture"
          className="h-[180px] w-full border-0"
        />
      </div>
      {caption ? <p className="mt-3 text-sm opacity-70">{caption}</p> : null}
    </Section>
  );
}
