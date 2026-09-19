import type { FaqBlock as FaqBlockType } from '@/payload-types';
import { Section } from './Section';

export function Faq({ heading, items, background }: FaqBlockType) {
  const playerHeading = heading === 'Before your team enters' ? 'Before you enter' : heading;
  return (
    <Section
      background={background}
      fallback="light"
      innerClassName="max-w-3xl"
    >
      {playerHeading ? (
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {playerHeading}
        </h2>
      ) : null}
      <div className="mt-8 divide-y divide-current/15">
        {(items ?? []).map((item) => (
          <details key={item.id} className="py-4">
            <summary className="cursor-pointer font-medium">
              {item.question === 'How do we join a tournament?' ? 'How do I join a tournament?' : item.question === 'What team format is used?' ? 'What squad format is used?' : item.question}
            </summary>
            <p className="mt-2 whitespace-pre-line opacity-70">{item.answer === 'Choose a tournament and complete the team entry form. The tournament desk reviews the entry and confirms payment manually.' ? 'Choose a tournament and complete the individual player entry form. The tournament desk reviews your entry and confirms payment manually.' : item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
