import type { TestimonialListBlock as TestimonialListBlockType } from '@/payload-types';
import { Section } from './Section';

// Testimonials: a responsive grid of quote cards with an optional author avatar.
// Surface-relative borders keep cards legible on any background.
export function TestimonialList({
  heading,
  testimonials,
  background,
}: TestimonialListBlockType) {
  const playerHeading = heading === 'Past winner records & team voices' ? 'Past winner records & player notes' : heading;
  return (
    <Section
      background={background}
      fallback="muted"
      innerClassName="max-w-6xl"
    >
      {playerHeading ? (
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {playerHeading}
        </h2>
      ) : null}
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(testimonials ?? []).map((testimonial) => (
          <figure
            key={testimonial.id}
            className="flex h-full flex-col rounded-xl border border-current/15 p-6"
          >
            <blockquote className="flex-1 whitespace-pre-line opacity-90">
              “{testimonial.quote === 'Your captain receives confirmation after the paid entry is reviewed manually.' ? 'You receive confirmation after your paid entry is reviewed manually.' : testimonial.quote}”
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              {testimonial.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={testimonial.avatarUrl}
                  alt={testimonial.authorName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : null}
              <div>
                <div className="font-semibold">{testimonial.authorName}</div>
                {testimonial.authorTitle ? (
                  <div className="text-sm opacity-60">
                    {testimonial.authorTitle === 'Team registration' ? 'Player registration' : testimonial.authorTitle}
                  </div>
                ) : null}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
