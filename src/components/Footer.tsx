import type { SiteSetting } from '@/payload-types';
import Link from 'next/link';

// Baked site footer, fed by the SiteSettings global. Restyle JSX + Tailwind
// only — keep content bindings on `settings` (tagline, copyright, links,
// socials, contact). Never hardcode those strings; Site Settings edits must
// apply. The footer is the only surface that renders `settings.contact`: drop
// the binding and the global's Contact group silently accepts input that
// reaches no page.
export function Footer({ settings }: { settings: SiteSetting }) {
  const links = settings.footer?.links ?? [];
  const socials = settings.socialLinks ?? [];
  const { email, phone, address } = settings.contact ?? {};
  const playerTagline = settings.footer?.tagline === 'Free Fire tournaments for squads ready to compete for the prize pool.' ? 'Free Fire tournaments for individual players ready to compete for the prize pool.' : settings.footer?.tagline;
  return (
    <footer className="border-t border-white/8 bg-[#080808] text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="font-semibold tracking-tight text-white">
              {settings.brandName}
            </div>
            {playerTagline ? (
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
                {playerTagline}
              </p>
            ) : null}
          </div>
          {email || phone || address ? (
            <address className="text-sm text-white/60 not-italic">
              {email ? (
                <div>
                  <a href={`mailto:${email}`}>{email}</a>
                </div>
              ) : null}
              {phone ? (
                <div>
                  <a href={`tel:${phone}`}>{phone}</a>
                </div>
              ) : null}
              {address ? (
                <div className="whitespace-pre-line">{address}</div>
              ) : null}
            </address>
          ) : null}
           <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
            {links.map((link) => (
              <li key={link.id}>
                <Link className="transition-colors hover:text-white" href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
          <ul className="flex gap-4 text-sm text-white/60">
            {socials.map((social) => (
              <li key={social.id}>
                <a href={social.href}>{social.platform}</a>
              </li>
            ))}
          </ul>
        </div>
        {settings.footer?.copyright ? (
           <p className="mt-10 border-t border-white/8 pt-6 text-xs text-white/35">
            {settings.footer.copyright}
          </p>
        ) : null}
      </div>
    </footer>
  );
}
