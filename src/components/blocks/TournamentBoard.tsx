import type { TournamentBoardBlock as TournamentBoardBlockType } from '@/payload-types';
import { Clock3, Coins, Trophy, UsersRound } from 'lucide-react';

const meta = [
  { key: 'entryFee', label: 'Entry fee', icon: Coins },
  { key: 'prizePool', label: 'Prize pool', icon: Trophy },
  { key: 'matchTime', label: 'Match time', icon: Clock3 },
  { key: 'squadFormat', label: 'Format', icon: UsersRound },
] as const;

export function TournamentBoard({ eyebrow, heading, body, tournaments }: TournamentBoardBlockType) {
  const playerBody = body === 'Every entry is reviewed manually after payment so the lobby stays clear and teams know where they stand.' ? 'Every entry is reviewed manually after payment so the lobby stays clear and every player knows where they stand.' : body;
  return <section id="tournaments" className="bg-black px-5 py-20 sm:px-8 md:py-32"><div className="mx-auto max-w-7xl">
    <div className="mb-10 max-w-2xl reveal"><p className="kicker">{eyebrow ?? 'Tournament lobby'}</p><h2 className="mt-5 display-title text-4xl sm:text-6xl">{heading}</h2>{playerBody ? <p className="body-copy mt-5">{playerBody}</p> : null}</div>
    <div className="grid gap-5 lg:grid-cols-3">{(tournaments ?? []).map((event, index) => <article key={event.id} className="dark-card reveal flex flex-col p-6" style={{ transitionDelay: `${index * 70}ms` }}>
      <div className="flex items-center justify-between gap-3"><span className="kicker">{event.status ?? 'Open registration'}</span><span className="text-xs text-white/45">#{String(index + 1).padStart(2, '0')}</span></div>
      <h3 className="mt-7 text-2xl font-semibold tracking-tight text-white">{event.name}</h3>
      <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 border-y border-white/8 py-6">{meta.map(({ key, label, icon: Icon }) => <div key={key}><dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.15em] text-white/45"><Icon size={13}/>{label}</dt><dd className="mt-2 text-sm font-medium text-white">{event[key]}</dd></div>)}</dl>
      <p className="mt-5 text-xs text-white/55"><span className="text-white/35">Registration closes </span>{event.registrationDeadline}</p>
      {event.ctaLabel && event.ctaHref ? <a href={event.ctaHref} className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#d3ff24] px-5 py-3 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 active:scale-[.97]">{event.ctaLabel === 'Request a team slot' ? 'Request a player slot' : event.ctaLabel}</a> : null}
    </article>)}</div>
  </div></section>;
}
