'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Team } from '@/data/accounts';
import { authAdapter, type AuthSession, type LoginRequest, type SignupRequest } from '@/services/auth-adapter';
import { platformRepository } from '@/services/platform-repository';
import type { LiveTournament } from '@/components/tournaments/TournamentExperience';

const { data: players } = platformRepository.getPlayers();
const { data: teams } = platformRepository.getTeams();

type FieldProps = { label: string; hint?: string; error?: string; children: ReactNode };
type DashboardCard = { label: string; title: string; copy: string; href: string; icon: ReactNode };

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z" /><path d="m9.5 12 1.7 1.7 3.5-3.7" /></svg>;
}

function Field({ label, hint, error, children }: FieldProps) {
  return <label className="field">
    <span>{label}</span>
    {children}
    {error ? <small role="alert" className="text-[#ff9aac]">{error}</small> : hint ? <small className="text-[#9ba1a8]">{hint}</small> : null}
  </label>;
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="platform-card mt-6 text-center">
    <p className="text-[#f0f2f5]">{children}</p>
    <p className="mt-2 text-sm text-[#a7adb4]">This view populates after verified platform records are available.</p>
  </div>;
}

export function AccessState({ title = 'Sign in required', copy = 'Connect your secure MasterGaming account to access this private player area.', action = 'Sign in' }: { title?: string; copy?: string; action?: string }) {
  return <section className="platform-card mt-7 max-w-2xl border-[#a6ff43]/25 text-center" aria-labelledby="access-state-title">
    <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-[#a6ff43]/35 bg-[#a6ff43]/10 text-[#c6ff91]"><ShieldIcon /></span>
    <h2 id="access-state-title" className="mt-4 text-2xl font-medium">{title}</h2>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#a7adb4]">{copy}</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Link href="/login" className="platform-button">{action}</Link>
      <Link href="/register" className="platform-button secondary">Create account</Link>
    </div>
  </section>;
}

export function AuthScreen({ register = false }: { register?: boolean }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const pageTitle = register ? 'Create your player profile' : 'Welcome back, competitor.';

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const nextErrors: Record<string, string> = {};
    if (register) {
      if (!String(values.name).trim()) nextErrors.name = 'Enter your full name.';
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(String(values.username))) nextErrors.username = 'Use 3–20 letters, numbers, or underscores.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email))) nextErrors.email = 'Enter a valid email address.';
      if (!/^\+?[0-9\s-]{8,18}$/.test(String(values.mobileNumber))) nextErrors.mobileNumber = 'Enter a valid mobile number.';
      if (String(values.password).length < 8) nextErrors.password = 'Use at least 8 characters.';
      if (values.password !== values.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
      if (!String(values.freeFireUid).trim()) nextErrors.freeFireUid = 'Enter your Free Fire UID.';
      if (!String(values.inGameName).trim()) nextErrors.inGameName = 'Enter your Free Fire IGN.';
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email))) nextErrors.email = 'Enter a valid email address.';
      if (!String(values.password)) nextErrors.password = 'Enter your password.';
    }
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    const result = register
      ? await authAdapter.signup({ username: String(values.username), name: String(values.name), email: String(values.email), mobileNumber: String(values.mobileNumber), password: String(values.password), freeFireUid: String(values.freeFireUid), inGameName: String(values.inGameName) } satisfies SignupRequest)
      : await authAdapter.login({ email: String(values.email), password: String(values.password), rememberSession: values.remember === 'on' } satisfies LoginRequest);
    setLoading(false);
    setMessage(result.message);
    // A full navigation deliberately follows successful Payload login. It lets
    // the browser send the newly-issued HttpOnly session cookie to the
    // server-side route guard instead of relying on transient client state.
    if (result.ok && result.session) window.location.assign(result.session.user.role === 'Admin' ? '/admin-panel' : '/account');
  };

  const requestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email') || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrors({ resetEmail: 'Enter a valid account email.' }); return; }
    setErrors({});
    setLoading(true);
    const result = await authAdapter.requestPasswordReset({ email });
    setLoading(false);
    setShowReset(false);
    setMessage(result.message);
  };

  return <main className="platform-shell grid gap-10 py-10 sm:py-16 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
    <section className="hidden border-r border-white/8 pr-12 lg:block">
      <p className="platform-label">MasterGaming account</p>
      <h1 className="platform-title mt-5 !text-5xl">Build your competitive identity.</h1>
      <p className="mt-5 max-w-md leading-7 text-[#a7adb4]">Player accounts bring together profiles, tournament registrations, teams, credits, and notifications.</p>
      <div className="mt-10 border-l border-[#a6ff43]/35 pl-4 text-sm leading-6 text-[#c8ccd1]">Player registration creates a Player account. Administration is a separate role-only area and is never granted from player registration.</div>
      <div className="mt-5 border-l border-[#e7b96a]/35 pl-4 text-sm leading-6 text-[#c8ccd1]">Your password is sent only to the secure sign-in service. This browser does not store your password.</div>
    </section>
    <section className="mx-auto w-full max-w-xl rounded-xl border border-[#a6ff43]/18 bg-[#191b20] p-6 shadow-[0_18px_50px_rgba(0,0,0,.26)] sm:p-8" aria-labelledby="auth-title">
      <p className="platform-label">{register ? 'Player registration' : 'Player sign-in'}</p>
      <h1 id="auth-title" className="mt-3 text-3xl font-medium">{pageTitle}</h1>
      <p className="mt-3 text-sm leading-6 text-[#a7adb4]">{register ? 'Create a player account with your tournament identity. Registration always starts with the Player role.' : 'Use your registered email and password to sign in. Admin access depends on the Admin role assigned to your authenticated account.'}</p>
      {message && <div className="mt-6 rounded-lg border border-[#a6ff43]/25 bg-[#a6ff43]/10 p-4 text-sm leading-6 text-[#d7f7bc]" role="status"><p className="font-medium">{message}</p>{register && <div className="mt-3"><Link href="/login" className="platform-link">Continue to sign in</Link></div>}</div>}
      <form className="mt-7 grid gap-4" onSubmit={submit} noValidate>
        {register && <>
          <Field label="Full name" error={errors.name}><input name="name" autoComplete="name" aria-invalid={Boolean(errors.name)} /></Field>
          <Field label="Username" hint="This becomes your player identity." error={errors.username}><input name="username" autoComplete="username" aria-invalid={Boolean(errors.username)} /></Field>
          <Field label="Email" error={errors.email}><input name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} /></Field>
          <Field label="Mobile number" hint="Used by the tournament desk for verified account contact." error={errors.mobileNumber}><input name="mobileNumber" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={Boolean(errors.mobileNumber)} /></Field>
        </>}
        {!register && <Field label="Email" error={errors.email}><input name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} /></Field>}
        <Field label="Password" hint={register ? 'Use at least 8 characters. Final rules are set by secure authentication.' : undefined} error={errors.password}><input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} aria-invalid={Boolean(errors.password)} /></Field>
        {register && <>
          <Field label="Confirm password" error={errors.confirmPassword}><input name="confirmPassword" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Free Fire UID" hint="Duplicate UID checks require the verified backend." error={errors.freeFireUid}><input name="freeFireUid" inputMode="numeric" aria-invalid={Boolean(errors.freeFireUid)} /></Field><Field label="Free Fire in-game name (IGN)" error={errors.inGameName}><input name="inGameName" aria-invalid={Boolean(errors.inGameName)} /></Field></div>
        </>}
        {!register && <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-[#a7adb4]"><input type="checkbox" name="remember" />Remember session</label>
          <button type="button" onClick={() => { setShowReset(true); setErrors({}); }} className="text-sm font-semibold text-[#baff78]">Forgot password?</button>
        </div>}
        <button className="platform-button mt-2 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Signing you in…' : register ? 'Create account' : 'Continue to sign in'}</button>
      </form>
      {showReset && <form className="mt-6 grid gap-4 rounded-lg border border-white/10 bg-black/10 p-4" onSubmit={requestReset} noValidate>
        <div className="flex items-center justify-between gap-4"><div><h2 className="font-medium">Password reset</h2><p className="mt-1 text-sm text-[#a7adb4]">We will use this once reset delivery is connected.</p></div><button type="button" onClick={() => setShowReset(false)} className="text-sm text-[#a7adb4]">Close</button></div>
        <Field label="Account email" error={errors.resetEmail}><input name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.resetEmail)} /></Field>
        <button className="platform-button secondary disabled:cursor-wait disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Preparing request…' : 'Request password reset'}</button>
      </form>}
      <p className="mt-7 text-sm text-[#a7adb4]">{register ? 'Already registered?' : 'New here?'} <Link className="platform-link" href={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create a player profile'}</Link></p>
    </section>
  </main>;
}

const dashboardCards: DashboardCard[] = [
  { label: 'Identity', title: 'Profile summary', copy: 'Your player identity and gaming details.', href: '/profile', icon: <ShieldIcon /> },
  { label: 'Game profile', title: 'Free Fire identity', copy: 'UID and in-game name appear after verification.', href: '/profile', icon: <span className="text-lg">FF</span> },
  { label: 'Competition', title: 'Joined tournaments', copy: 'Verified tournament registrations appear here.', href: '/tournaments', icon: <span className="text-lg">01</span> },
  { label: 'Matches', title: 'Match history', copy: 'Reviewed match outcomes and placement appear here.', href: '/profile', icon: <span className="text-lg">MH</span> },
  { label: 'Squad', title: 'Team information', copy: 'Your verified team status appears here.', href: '/teams', icon: <span className="text-lg">05</span> },
  { label: 'Balance', title: 'Wallet and credits', copy: 'Manual-review records only, never an automated wallet.', href: '/credits', icon: <span className="text-lg">PKR</span> },
  { label: 'Ledger', title: 'Transaction history', copy: 'Verified manual ledger activity appears here.', href: '/credits', icon: <span className="text-lg">TX</span> },
  { label: 'Performance', title: 'Wins and kills', copy: 'Verified match wins and total kills appear here.', href: '/profile', icon: <span className="text-lg">WK</span> },
  { label: 'Rewards', title: 'Earnings', copy: 'Reviewed prize credits and earnings appear here.', href: '/credits', icon: <span className="text-lg">Rs</span> },
  { label: 'Updates', title: 'Notifications', copy: 'Tournament and account notices appear here.', href: '/help', icon: <span className="text-lg">••</span> },
  { label: 'Progress', title: 'Achievements', copy: 'Verified milestones and badges appear here.', href: '/profile', icon: <span className="text-lg">★</span> },
];

function usePlatformSession() { const [session, setSession] = useState<AuthSession | undefined>(undefined); useEffect(() => { let active = true; authAdapter.getSession().then(value => { if (active) setSession(value); }); return () => { active = false; }; }, []); return session; }

function PlayerTournaments() { const [registrations, setRegistrations] = useState<{ id: string; status: string; tournament: LiveTournament }[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { let active = true; const refresh = async () => { const response = await fetch('/cms-api/tournament-registrations?depth=1&limit=100&sort=-createdAt', { credentials: 'include', cache: 'no-store' }); if (response.ok && active) setRegistrations((await response.json() as { docs: { id: string; status: string; tournament: LiveTournament }[] }).docs); if (active) setLoading(false); }; void refresh(); window.addEventListener('tournament-registration-created', refresh); return () => { active = false; window.removeEventListener('tournament-registration-created', refresh); }; }, []); return <section className="platform-card mt-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="platform-label">Tournament activity</p><h2 className="mt-2 text-xl font-medium">Joined tournaments</h2></div><Link className="platform-link" href="/tournaments">Find tournaments</Link></div>{loading ? <p className="mt-4 text-sm text-[#a7adb4]">Loading registrations…</p> : registrations.length ? <div className="mt-5 grid gap-3">{registrations.map(registration => <article className="rounded-lg border border-white/8 bg-black/15 p-4" key={registration.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-medium">{registration.tournament.name}</h3><p className="mt-1 text-sm text-[#a7adb4]">{registration.tournament.gameMode} · {registration.tournament.format}</p></div><span className="platform-status upcoming">{registration.status}</span></div><div className="mt-4 grid gap-2 text-sm text-[#a7adb4] sm:grid-cols-2"><p>Upcoming match: {new Date(registration.tournament.schedule).toLocaleString()}</p><p>Registration status: {registration.status}</p></div></article>)}</div> : <p className="mt-4 text-sm text-[#a7adb4]">You have not joined a tournament yet.</p>}</section>; }
function WalletSummary() { const [balance, setBalance] = useState<number>(); useEffect(() => { void (async () => { const response = await fetch('/cms-api/wallets?limit=1', { credentials: 'include', cache: 'no-store' }); if (response.ok) { const body = await response.json() as { docs: { balance: number }[] }; setBalance(body.docs[0]?.balance || 0); } })(); }, []); return <section className="platform-card mt-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="platform-label">Wallet</p><h2 className="mt-2 text-xl font-medium">Available credits</h2></div><Link className="platform-link" href="/credits">View finance activity</Link></div><p className="mt-4 text-3xl font-medium">{balance === undefined ? 'Loading…' : `PKR ${balance.toLocaleString()}`}</p><p className="mt-2 text-sm text-[#a7adb4]">Your balance is loaded from the authenticated wallet record.</p></section>; }

export function AccountDashboard() {
  const session = usePlatformSession();
  if (session === undefined) return <main className="platform-shell py-10 sm:py-14"><p className="text-sm text-[#a7adb4]">Checking your account session…</p></main>;
  if (!session) return <main className="platform-shell py-10 sm:py-14"><AccessState /></main>;
  return <main className="platform-shell py-10 sm:py-14">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="platform-label">Account center</p><h1 className="platform-heading mt-3">Your player dashboard.</h1></div><span className="platform-status upcoming">Signed in as {session.user.role}</span></div>
    <p className="mt-4 max-w-2xl leading-7 text-[#a7adb4]">Your account keeps player identity, tournament activity, team, credits, transactions, notifications, and achievements in one place.</p>
    <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Player account areas">{dashboardCards.map(card => <Link key={card.title} href={card.href} className="platform-card group">
      <div className="flex items-start justify-between gap-4"><span className="grid h-10 min-w-10 place-items-center rounded-lg border border-[#a6ff43]/25 bg-[#a6ff43]/10 text-[#c6ff91]">{card.icon}</span><ArrowIcon /></div>
      <p className="platform-label mt-5">{card.label}</p><h2 className="mt-2 text-xl font-medium">{card.title}</h2><p className="mt-3 text-sm leading-6 text-[#a7adb4]">{card.copy}</p><span className="platform-link mt-5 inline-flex items-center gap-2">Open area <ArrowIcon /></span>
    </Link>)}</section>
     {session.user.role === 'Player' && <PlayerTournaments />}
     {session.user.role === 'Player' && <WalletSummary />}
    <section className="platform-card mt-6 border-[#ff9aac]/25"><p className="platform-label">Access policy</p><h2 className="mt-3 text-xl font-medium">Player access stays separate from administration.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#a7adb4]">Your account role comes from the authenticated Payload user record. Player accounts cannot access MasterGaming Control; the Admin route enforces that policy on the server.</p></section>
  </main>;
}

export function Profile() { const session = usePlatformSession(); if (session === undefined) return <main className="platform-shell py-10 sm:py-14"><p className="text-sm text-[#a7adb4]">Checking your account session…</p></main>; if (!session) return <main className="platform-shell py-10 sm:py-14"><AccessState title="Sign in to unlock your profile" copy="Profile, competitive progress, earnings, and achievement data are private until you sign in." /></main>; return <main className="platform-shell py-10 sm:py-14"><p className="platform-label">Player profile</p><h1 className="platform-heading mt-3">{session.user.name}</h1><p className="mt-4 max-w-2xl leading-7 text-[#a7adb4]">Your authenticated profile includes your Free Fire UID, in-game name, competitive activity, and verified progress.</p><section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[['Gaming identity', `${session.user.gamingIdentity?.freeFireUid || 'Not provided'} · ${session.user.gamingIdentity?.inGameName || 'Not provided'}`], ['Account role', session.user.role], ['Competition', 'Tournaments and match history'], ['Progress', 'Ranks and achievements']].map(([label, detail]) => <article key={label} className="platform-card cursor-default hover:!translate-y-0 hover:!border-[#292b31]"><p className="platform-label">{label}</p><h2 className="mt-3 text-lg font-medium">{detail}</h2><p className="mt-4 text-sm leading-6 text-[#a7adb4]">Verified platform records appear here when available.</p></article>)}</section>{session.user.role === 'Player' && <PlayerTournaments />}</main>; }

export function TeamCard({ team }: { team: Team }) { return <article className="platform-card mt-4"><h2 className="text-xl font-medium">{team.name}</h2><Link className="platform-link mt-3 inline-flex items-center gap-2" href={`/teams/${team.id}`}>View team <ArrowIcon /></Link></article>; }
export function Teams() { const [query, setQuery] = useState(''); const shown = useMemo(() => teams.filter(team => `${team.name} ${team.tag}`.toLowerCase().includes(query.toLowerCase())), [query]); return <main className="platform-shell py-10 sm:py-14"><h1 className="platform-heading">Teams</h1><input className="mt-8 w-full rounded-lg border border-white/12 bg-[#0b0b0b] px-3 py-3 text-sm text-white outline-none focus:border-[#a6ff43]" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search team name or tag" aria-label="Search teams" />{shown.length ? <section>{shown.map(team => <TeamCard key={team.id} team={team} />)}</section> : <Empty>No verified teams yet.</Empty>}</main>; }
export function TeamDetail({ team }: { team?: Team }) { return <main className="platform-shell py-16">{team ? <TeamCard team={team} /> : <Empty>No verified team record is available.</Empty>}</main>; }
export function Players() { const [query, setQuery] = useState(''); const search = useSearchParams(); const shown = players.filter(player => `${player.username} ${player.region}`.toLowerCase().includes(query.toLowerCase())); return <main className="platform-shell py-10"><h1 className="platform-heading">Player directory</h1>{search.get('player') && !players.some(player => player.id === search.get('player')) ? <Empty>No verified player record is available.</Empty> : null}<input className="mt-6 w-full rounded-lg border border-white/12 bg-[#0b0b0b] px-3 py-3 text-sm text-white outline-none focus:border-[#a6ff43]" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search player name or region" aria-label="Search players" />{shown.length ? <div>{shown.map(player => <article key={player.id}>{player.username}</article>)}</div> : <Empty>No verified players yet.</Empty>}</main>; }
export function CreateTeam({ manage = false }: { manage?: boolean }) { return <main className="platform-shell py-10"><h1 className="platform-heading">{manage ? 'Team management' : 'Create a team'}</h1><AccessState title="Secure player account required" copy={`Sign in with a verified account to ${manage ? 'manage' : 'create'} a team.`} /></main>; }
