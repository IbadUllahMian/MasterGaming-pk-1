import { Fragment } from 'react';
import type { ComponentType } from 'react';
import type { Page } from '@/payload-types';
import { Hero } from './Hero';
import { FeatureGrid } from './FeatureGrid';
import { Cta } from './Cta';
import { TestimonialList } from './TestimonialList';
import { Faq } from './Faq';
import { Gallery } from './Gallery';
import { Stats } from './Stats';
import { LogoCloud } from './LogoCloud';
import { RichText } from './RichText';
import { Contact } from './Contact';
import { CollectionList } from './CollectionList';
import { AudioEmbed } from './AudioEmbed';
import { PeopleList } from './PeopleList';
import { RelatedItems } from './RelatedItems';
// Custom per-site block component imports are written between the
// markers below by the deterministic registry injector — do not hand-edit
// between them.
// >>> generated block imports
import { RankingsTable } from './RankingsTable';
import { TeamSignup } from './TeamSignup';
import { TournamentBoard } from './TournamentBoard';
// <<< generated block imports

// Route search params, threaded from the page so faceted blocks can read
// the active `?tag=` facet — nested server components do not receive
// `searchParams` directly.
type SearchParams = Record<string, string | string[] | undefined> | undefined;

// Generic renderer. The baked page server component fetches a `Pages` doc and
// hands its `layout` array here; per-design variation lives entirely in the
// block components above, never in the data fetch or this map. Custom per-site
// blocks are registered between the sentinel markers by a deterministic
// post-generation injector — never hand-edited — so the literal map stays
// well-formed.
const blockComponents = {
  hero: Hero,
  featureGrid: FeatureGrid,
  cta: Cta,
  testimonialList: TestimonialList,
  faq: Faq,
  gallery: Gallery,
  stats: Stats,
  logoCloud: LogoCloud,
  richText: RichText,
  contact: Contact,
  collectionList: CollectionList,
  audioEmbed: AudioEmbed,
  peopleList: PeopleList,
  relatedItems: RelatedItems,
  // Custom per-site block `slug: Component` entries are written between
  // the markers below by the deterministic registry injector — do not hand-edit
  // between them.
  // >>> generated block registry
  'rankingsTable': RankingsTable,
  'teamSignup': TeamSignup,
  'tournamentBoard': TournamentBoard,
  // <<< generated block registry
};

export function RenderBlocks({
  blocks,
  searchParams,
}: {
  blocks: Page['layout'];
  searchParams?: SearchParams;
}) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <Fragment>
      {/* Block-only render marker: present ONLY when Payload blocks render this
          page, never in a classic page's markup. Zero visual footprint (hidden,
          empty). The migration parity gate reads it to distinguish a genuinely
          pixel-perfect Payload render (0.000% diff, marker present) from the
          gate-gaming case where the classic route still shadows the catch-all
          (0.000% diff, marker absent). */}
      <span data-payload-render hidden />
      {blocks.map((block, index) => {
        // Index narrowly FIRST — a blockType missing from the map is a compile
        // error here — then one localized cast: TS cannot express the
        // correlated-union dispatch (each component accepts exactly its own
        // block member, plus the renderer-injected `searchParams` that only
        // faceted blocks read). The call below stays typed against the block
        // union, so the spread itself is checked; per-component prop-name
        // drift against the schema is caught mechanically by the cms
        // validator's component-props gate.
        const Component = blockComponents[
          block.blockType
        ] as unknown as ComponentType<
          typeof block & { searchParams?: SearchParams }
        >;
        if (!Component) return null;
        return (
          <Component
            key={block.id ?? index}
            {...block}
            searchParams={searchParams}
          />
        );
      })}
    </Fragment>
  );
}
