import type { Block } from 'payload';

// Per-site CUSTOM block schemas, authored by the generation pipeline ONLY when a
// design needs a bespoke section no library block covers (a scroller, a carousel,
// an interactive switcher, an audio/guest variant). The template ships this
// empty: most sites compose entirely from the baked library in `index.ts`.
//
// This is the schema half of a custom block TRIPLE; the other two halves are the
// React component (`src/components/blocks/<Name>.tsx`) and the registry entry in
// `RenderBlocks.tsx`'s `blockComponents` map. The registry entry is written by a
// deterministic post-generation injector (between the sentinel markers in
// RenderBlocks.tsx), never hand-edited by the generator — so the literal map
// stays well-formed. `payload.config.ts` loads these via `layoutBlocks`, and the
// cms validator's `block-triple`/`component-props` checks cover them
// automatically once they are registered here.
//
// When authoring, give each block a unique slug that does NOT collide with a
// library block, e.g.:
//
//   export const generatedBlocks: Block[] = [
//     {
//       slug: 'storyScroller',
//       interfaceName: 'StoryScrollerBlock',
//       fields: [
//         { name: 'heading', type: 'text' },
//         { name: 'steps', type: 'array', fields: [{ name: 'caption', type: 'text' }] },
//       ],
//     },
//   ];
export const generatedBlocks: Block[] = [
  {
    slug: 'tournamentBoard',
    interfaceName: 'TournamentBoardBlock',
    fields: [
      { name: 'eyebrow', type: 'text' },
      { name: 'heading', type: 'text', required: true },
      { name: 'body', type: 'textarea' },
      {
        name: 'tournaments',
        type: 'array',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'status', type: 'text' },
          { name: 'entryFee', type: 'text', required: true },
          { name: 'prizePool', type: 'text', required: true },
          { name: 'matchTime', type: 'text', required: true },
          { name: 'squadFormat', type: 'text', required: true },
          { name: 'registrationDeadline', type: 'text', required: true },
          { name: 'ctaLabel', type: 'text' },
          { name: 'ctaHref', type: 'text' },
        ],
      },
    ],
  },
  {
    slug: 'rankingsTable',
    interfaceName: 'RankingsTableBlock',
    fields: [
      { name: 'eyebrow', type: 'text' },
      { name: 'heading', type: 'text', required: true },
      { name: 'body', type: 'textarea' },
      {
        name: 'teams',
        type: 'array',
        fields: [
          { name: 'rank', type: 'text', required: true },
          { name: 'teamName', type: 'text', required: true },
          { name: 'matches', type: 'text', required: true },
          { name: 'points', type: 'text', required: true },
          { name: 'status', type: 'text' },
        ],
      },
    ],
  },
  {
    slug: 'teamSignup',
    interfaceName: 'TeamSignupBlock',
    fields: [
      { name: 'eyebrow', type: 'text' },
      { name: 'heading', type: 'text', required: true },
      { name: 'body', type: 'textarea' },
      { name: 'paymentNote', type: 'textarea' },
    ],
  },
];
