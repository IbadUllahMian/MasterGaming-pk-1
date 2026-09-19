import type { PeopleListBlock as PeopleListBlockType } from '@/payload-types';
import { Section } from './Section';

// People list. A reusable people grid — team members, speakers, guests,
// contributors. Brand-agnostic; generated designs restyle it.
export function PeopleList({
  heading,
  people,
  background,
}: PeopleListBlockType) {
  if (!people || people.length === 0) return null;
  return (
    <Section
      background={background}
      fallback="light"
      innerClassName="max-w-5xl"
    >
      {heading ? (
        <h2 className="mb-8 text-3xl font-semibold tracking-tight">
          {heading}
        </h2>
      ) : null}
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => {
          const card = (
            <>
              {person.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.avatarUrl}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : null}
              <div className="mt-4">
                <p className="font-medium">{person.name}</p>
                {person.role ? (
                  <p className="text-sm opacity-70">{person.role}</p>
                ) : null}
                {person.bioShort ? (
                  <p className="mt-2 text-sm opacity-70">{person.bioShort}</p>
                ) : null}
              </div>
            </>
          );
          return (
            <li key={person.id ?? person.name}>
              {person.href ? (
                <a href={person.href} className="block hover:opacity-80">
                  {card}
                </a>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
