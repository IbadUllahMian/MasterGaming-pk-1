import type { SiteSetting } from '@/payload-types';
import Link from 'next/link';

// Baked site header, fed by the SiteSettings global. Generated designs restyle
// this component's JSX/Tailwind; the content (brand, logo, nav items) comes
// from seed.json's siteSettings, never hard-coded here.
export function Header({ settings }: { settings: SiteSetting }) {
  const navItems = settings.navItems ?? [];
  const primaryLogoUrl = 'https://static.kite.ai/image/upload/c_crop,x_0.000,y_0.036,w_1.000,h_0.766/v1789264184/app/e5120da1-b491-4f79-b066-5ee9682049c7/iter2/mastergaming-mark-r1.png';
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-black/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white"
        >
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl || primaryLogoUrl}
              alt={settings.brandName}
              className="h-9 w-9 object-contain"
            />
          ) : settings.brandName}
        </Link>
        <ul className="hidden items-center gap-6 text-sm text-white/60 md:flex">
          {navItems.map((item) => (
            <li key={item.id}>
                <Link className="transition-colors hover:text-white" href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul><Link href="/register" className="rounded-full bg-[#d3ff24] px-4 py-2 text-xs font-bold text-black transition-transform hover:-translate-y-0.5 active:scale-[.97]">Enter as a player</Link>
      </nav>
    </header>
  );
}
