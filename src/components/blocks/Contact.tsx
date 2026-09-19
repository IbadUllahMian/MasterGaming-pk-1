import type { ContactBlock as ContactBlockType } from '@/payload-types';
import { Section } from './Section';

export function Contact({
  heading,
  body,
  email,
  phone,
  address,
  background,
}: ContactBlockType) {
  return (
    <Section
      background={background}
       fallback="dark"
      innerClassName="max-w-3xl"
    >
       <div className="dark-card p-8 text-center">
        {heading ? (
           <h2 className="display-title text-4xl text-white">{heading}</h2>
        ) : null}
         {body ? <p className="body-copy mx-auto mt-3">{body}</p> : null}
         <div className="mt-6 space-y-1 text-white/80">
          {email ? (
            <p>
              <a href={`mailto:${email}`} className="underline">
                {email}
              </a>
            </p>
          ) : null}
          {phone ? (
            <p>
              <a href={`tel:${phone}`} className="underline">
                {phone}
              </a>
            </p>
          ) : null}
          {address ? <p className="whitespace-pre-line">{address}</p> : null}
        </div>
      </div>
    </Section>
  );
}
