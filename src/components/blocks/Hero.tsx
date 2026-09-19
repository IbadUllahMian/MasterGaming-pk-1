import type { HeroBlock as HeroBlockType } from '@/payload-types';

// Default hero. `imageUrl` may be an image OR a video URL (switched on the
// extension), rendered as a full-bleed background with a neutral dark overlay
// for legibility; with no media it falls back to a simple centered hero.
// Generated designs restyle this component; the prop contract stays fixed.
const VIDEO_RE = /\.(mp4|mov|webm|m4v|ogg)(\?|#|$)/i;

export function Hero({
  eyebrow,
  heading,
  subheading,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  imageUrl,
}: HeroBlockType) {
  const playerHeading = heading === 'Bring your squad. Take the prize pool.' ? 'Bring your game. Take the prize pool.' : heading;
  const playerSubheading = subheading === 'MasterGaming.pk runs paid-entry Free Fire tournaments for serious esports teams. Register your squad, complete payment, and receive manual entry confirmation.' ? 'MasterGaming.pk runs paid-entry Free Fire tournaments for individual players. Register yourself, complete payment, and receive manual entry confirmation.' : subheading;
  const playerPrimaryCtaLabel = primaryCtaLabel === 'Enter your team' ? 'Enter as a player' : primaryCtaLabel;
  const isVideo = !!imageUrl && VIDEO_RE.test(imageUrl);
  const hasImage = !!imageUrl && !isVideo;
  const hasMedia = isVideo || hasImage;

  return (
    <section
      className="relative overflow-clip bg-black px-5 text-white sm:px-8"
    >
      {isVideo ? (
        <video
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
        >
          <source src={imageUrl ?? undefined} />
        </video>
      ) : null}
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl ?? undefined}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {hasMedia ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_75%)]"
          aria-hidden="true"
        />
      ) : null}

       <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-5 py-28 text-center md:py-40">
        {eyebrow ? (
           <p className="kicker reveal">
            {eyebrow}
          </p>
        ) : null}
         <h1 className="display-title reveal max-w-5xl text-5xl sm:text-7xl md:text-8xl">
          {playerHeading}
        </h1>
        {subheading ? (
           <p className="body-copy reveal max-w-2xl text-base sm:text-lg">
            {playerSubheading}
          </p>
        ) : null}
        {(primaryCtaLabel && primaryCtaHref) ||
        (secondaryCtaLabel && secondaryCtaHref) ? (
           <div className="reveal mt-3 flex flex-wrap items-center justify-center gap-3">
            {playerPrimaryCtaLabel && primaryCtaHref ? (
              <a
                href={primaryCtaHref}
                 className="rounded-full bg-[#d3ff24] px-6 py-3 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 active:scale-[.97]"
              >
                {playerPrimaryCtaLabel}
              </a>
            ) : null}
            {secondaryCtaLabel && secondaryCtaHref ? (
              <a
                href={secondaryCtaHref}
                 className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:scale-[.97]"
              >
                {secondaryCtaLabel}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
